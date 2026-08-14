#!/usr/bin/env node
/**
 * Migração da planilha "TDL QA MULTI 2026.xlsx" (Fase 5) para o Supabase.
 *
 * PRÉ-REQUISITOS (não automatizados por este script):
 *   1. O projeto Supabase precisa existir e o schema.sql já ter rodado.
 *   2. O departamento de destino (ex: "Qualidade") precisa já existir na
 *      tabela `departments`, com o slug passado em --department.
 *   3. Os 20 colaboradores (usuários) precisam já existir na tabela `users`
 *      desse departamento, com o NOME EXATAMENTE IGUAL ao nome da aba deles
 *      na planilha (ex: aba "Israel" -> users.name = "Israel"). Isso é o que
 *      a Fase 6 (admin) ou um insert manual no SQL Editor deve ter feito
 *      antes de rodar esta migração.
 *
 * MODO DE USO:
 *   node scripts/migrate-spreadsheet.mjs --file "C:\caminho\TDL QA MULTI 2026.xlsx" [opções]
 *
 * Por padrão roda em modo DRY-RUN (não escreve nada no banco, só mostra o
 * que faria). Passe --commit para gravar de verdade.
 *
 * Opções:
 *   --file <caminho>        Caminho do .xlsx (obrigatório)
 *   --department <slug>     Slug do departamento de destino (default: "qualidade")
 *   --status-rule <regra>   "due-date" (default) ou "always-ready" — ver
 *                            explicação abaixo, decisão NÃO confirmada com o
 *                            usuário, revisar antes de rodar de verdade.
 *   --commit                Grava no banco (sem isso, é só relatório)
 *
 * Regra --status-rule (decisão em aberto, ver CLAUDE.md):
 *   "due-date"    (default): linha com Prazo preenchido entra como on_going;
 *                 sem Prazo entra como ready. Replica a mesma lógica que o
 *                 app usaria se a atividade fosse criada agora, mas aplicada
 *                 a dados retroativos.
 *   "always-ready": toda linha migrada entra como ready, igual a uma
 *                 atividade nova criada no app (decisão confirmada pelo
 *                 usuário SÓ para criação nova, nunca testada para migração).
 *
 * SAÍDA: dois arquivos CSV em scripts/migration-output/ com timestamp:
 *   - migrated_<ts>.csv        linhas que seriam/foram inseridas
 *   - manual_review_<ts>.csv   linhas puladas, com o motivo
 *
 * Decisão confirmada com o usuário em 2026-08-14: linhas marcadas como
 * finalizadas na planilha ("Good"/"Concluído.../Finalizado/Closed) também
 * são migradas — como atividade com status "closed" e completed_date igual
 * à coluna "Realizado". Não é mais um universo só de trabalho aberto, é o
 * histórico completo. Uma linha finalizada sem data em "Realizado" cai em
 * revisão manual (nunca fabrica uma data de conclusão).
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Carrega .env.local manualmente (este script roda fora do Next.js, que é o
// único que sabe carregar .env.local sozinho).
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { department: "qualidade", statusRule: "due-date", commit: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") args.file = argv[++i];
    else if (a === "--department") args.department = argv[++i];
    else if (a === "--status-rule") args.statusRule = argv[++i];
    else if (a === "--commit") args.commit = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.file) {
  console.error("Uso: node scripts/migrate-spreadsheet.mjs --file <caminho.xlsx> [--department slug] [--status-rule due-date|always-ready] [--commit]");
  process.exit(1);
}
if (!existsSync(args.file)) {
  console.error(`Arquivo não encontrado: ${args.file}`);
  process.exit(1);
}
if (!["due-date", "always-ready"].includes(args.statusRule)) {
  console.error(`--status-rule inválido: ${args.statusRule} (use "due-date" ou "always-ready")`);
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!args.commit) {
  console.log("=== MODO DRY-RUN — nada será gravado no banco. Use --commit para gravar de verdade. ===\n");
} else {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SUPABASE_URL.includes("placeholder")) {
    console.error("SUPABASE_URL/SERVICE_ROLE_KEY ausentes ou ainda placeholder em .env.local — configure antes de usar --commit.");
    process.exit(1);
  }
}

const supabase =
  args.commit && SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

// Pessoas que saíram da empresa (confirmado pelo usuário em 2026-08-14) — as
// abas delas são ignoradas por completo, como se não existissem na planilha
// (nem entram no relatório de revisão manual, é uma exclusão intencional).
const EXCLUDED_OWNERS = new Set(
  ["Josiele", "Victor", "Oseas", "Anderson", "Wilson Rocha", "George", "Alfredo", "Adria"].map(
    normalize
  )
);

// Nome da aba na planilha nem sempre bate com o nome atual da pessoa no
// banco (ex: apelido corrigido depois do cadastro inicial). Mapeia aqui
// quando isso acontecer, em vez de renomear a aba na planilha original.
const OWNER_NAME_ALIASES = new Map([[normalize("AlexandreSS"), "Alexandre"]]);

function resolveOwnerLookupName(sheetName) {
  return OWNER_NAME_ALIASES.get(normalize(sheetName)) ?? sheetName;
}

// ---------------------------------------------------------------------------
// Normalização de texto (tira acento, minúsculo, colapsa espaço/pontuação)
// ---------------------------------------------------------------------------
function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Conjuntos vistos na planilha real (ver CLAUDE.md, seção "A planilha
// original"). Qualquer valor fora dessas 2 listas vira revisão manual —
// nunca assumido silenciosamente.
const FINISHED_TOKENS = new Set([
  "concluido no tempo",
  "good",
  "concluido",
  "concluido c atraso",
  "finalizado",
  "closed",
]);

const ACTIVE_TOKENS = new Set([
  "andamento",
  "on going",
  "andamentro", // typo real da planilha
  "em andamento",
  "ongoing",
  "delayed",
  "standby",
  "standb", // typo real da planilha
  "sem data",
]);

function classifyStatus(statusRaw, performanceRaw) {
  const s = normalize(statusRaw);
  const p = normalize(performanceRaw);
  const candidate = s || p;
  // Decisão confirmada com o usuário em 2026-08-14: algumas pessoas (Carla,
  // Rosiane) nunca preencheram Status/Performance em nenhuma linha aberta.
  // Como ninguém marcou como finalizado, entra como "active" — a pessoa
  // revisa/fecha depois no app o que já não fizer mais sentido.
  if (!candidate) return { kind: "active" };
  if (FINISHED_TOKENS.has(candidate)) return { kind: "finished" };
  if (ACTIVE_TOKENS.has(candidate)) return { kind: "active" };
  return { kind: "unknown", detail: `valor não reconhecido: "${candidate}"` };
}

// Gera o "Nome da Atividade" (curto) a partir da descrição longa — mesma
// heurística de scripts/backfill-activity-names.mjs, ver comentário lá.
function summarizeName(title) {
  const MAX_LEN = 70;
  let s = String(title ?? "").trim();
  const markers = [/\n/, / Email\s*\d*\s*:/i, / SPM\s*:/i, / E-?mail\s*:/i];
  for (const m of markers) {
    const match = s.search(m);
    if (match > 0) s = s.slice(0, match);
  }
  s = s.trim().replace(/[-:.,;]+$/, "").trim();
  if (!s) s = String(title ?? "").trim().slice(0, MAX_LEN);
  if (s.length > MAX_LEN) {
    const cut = s.slice(0, MAX_LEN);
    const lastSpace = cut.lastIndexOf(" ");
    s = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim() + "…";
  }
  return s || "Atividade sem título";
}

// ---------------------------------------------------------------------------
// Conversão de data serial do Excel -> "YYYY-MM-DD"
// ---------------------------------------------------------------------------
function excelDateToISO(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const y = String(parsed.y).padStart(4, "0");
    const m = String(parsed.m).padStart(2, "0");
    const d = String(parsed.d).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // tenta strings dd/mm/yyyy ou yyyy-mm-dd
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return str.slice(0, 10);
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const [, d, m, yRaw] = brMatch;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// Casamento de coluna por nome é feito por texto NORMALIZADO (sem acento,
// minúsculo) — achado real na inspeção: algumas abas escrevem "Urgencia"/
// "Tendencia" sem acento, e "Follow Up" no lugar de "F´UP". Comparar direto
// (accent-sensitive) fazia 85 linhas perderem Urgência/Tendência em silêncio
// (viravam `undefined`, caíam certo em revisão manual, mas por um motivo
// errado — o valor existia, só não foi encontrado).
function findHeaderRowIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const normalized = rows[i].map((c) => normalize(c));
    if (normalized.includes("inicio") && normalized.includes("atividade")) return i;
  }
  return -1;
}

function col(header, ...names) {
  const normalizedHeader = header.map((h) => normalize(h));
  for (const name of names) {
    const idx = normalizedHeader.indexOf(normalize(name));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const workbook = XLSX.readFile(args.file);
  const sheetNames = workbook.SheetNames.filter(
    (n) => n !== "To do list_Modelo" && n !== "tabela"
  );

  console.log(`Departamento de destino: ${args.department}`);
  console.log(`Regra de status: ${args.statusRule}`);
  console.log(`Abas de colaborador encontradas: ${sheetNames.length}\n`);

  let departmentId = null;
  const userIdByName = new Map();

  if (args.commit) {
    const { data: dept, error: deptError } = await supabase
      .from("departments")
      .select("id, name")
      .eq("slug", args.department)
      .maybeSingle();

    if (deptError || !dept) {
      console.error(`Departamento com slug "${args.department}" não encontrado no Supabase. Crie-o antes (Fase 6 / SQL manual).`);
      process.exit(1);
    }
    departmentId = dept.id;

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name")
      .eq("department_id", departmentId)
      .eq("active", true);

    if (usersError) {
      console.error("Erro ao buscar usuários do departamento:", usersError);
      process.exit(1);
    }
    for (const u of users ?? []) {
      userIdByName.set(normalize(u.name), u.id);
    }
    console.log(`Usuários já cadastrados no departamento: ${users?.length ?? 0}\n`);
  }

  const migrated = [];
  const manualReview = [];
  let migratedFinished = 0;
  let migratedActive = 0;

  for (const sheetName of sheetNames) {
    if (EXCLUDED_OWNERS.has(normalize(sheetName))) {
      console.log(`  [ignorada] aba "${sheetName}" — pessoa não faz mais parte da empresa.`);
      continue;
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: "",
      raw: true,
    });
    const headerIdx = findHeaderRowIndex(rows);
    if (headerIdx === -1) {
      manualReview.push({ sheet: sheetName, row: "-", reason: "Cabeçalho da tabela não encontrado nesta aba" });
      continue;
    }
    const header = rows[headerIdx].map((c) => String(c ?? "").trim());

    const idx = {
      inicio: col(header, "Início"),
      prazo: col(header, "Prazo"),
      atividade: col(header, "Atividade"),
      gravidade: col(header, "Gravidade", "G"),
      urgencia: col(header, "Urgência", "U"),
      tendencia: col(header, "Tendência", "T"),
      dono: col(header, "Dono"),
      fup: col(header, "F´UP", "F'UP", "FUP", "Follow Up"),
      realizado: col(header, "Realizado"),
      status: col(header, "Status"),
      performance: col(header, "Performance"),
    };

    // O dono "de verdade" é o nome da própria aba — mais confiável que a
    // coluna "Dono" (texto livre, pode ter sobrenome, apelido, etc.), exceto
    // quando há um alias cadastrado (ver OWNER_NAME_ALIASES).
    const ownerLookupName = resolveOwnerLookupName(sheetName);
    const ownerId = userIdByName.get(normalize(ownerLookupName));
    if (args.commit && !ownerId) {
      manualReview.push({
        sheet: sheetName,
        row: "-",
        reason: `Nenhum usuário chamado "${sheetName}" encontrado no departamento — cadastre-o antes de migrar esta aba`,
      });
      continue;
    }

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      const title = String(row[idx.atividade] ?? "").trim();
      if (!title) continue; // linha vazia

      const rowLabel = `${sheetName}!${r + 1}`;

      const statusInfo = classifyStatus(row[idx.status], row[idx.performance]);
      if (statusInfo.kind === "ambiguous" || statusInfo.kind === "unknown") {
        manualReview.push({ sheet: sheetName, row: rowLabel, reason: `Status ambíguo: ${statusInfo.detail}`, title });
        continue;
      }

      const donoRaw = String(row[idx.dono] ?? "").trim();
      if (donoRaw && !normalize(donoRaw).startsWith(normalize(sheetName))) {
        console.warn(`  [aviso] ${rowLabel}: coluna Dono="${donoRaw}" não bate com a aba "${sheetName}" — usando a aba mesmo assim.`);
      }

      const startDate = excelDateToISO(row[idx.inicio]);
      if (!startDate) {
        manualReview.push({ sheet: sheetName, row: rowLabel, reason: "Campo Início ausente/ilegível", title });
        continue;
      }
      const dueDate = excelDateToISO(row[idx.prazo]);

      const gravidade = Number(row[idx.gravidade]);
      const urgencia = Number(row[idx.urgencia]);
      const tendencia = Number(row[idx.tendencia]);
      if (
        !Number.isInteger(gravidade) || gravidade < 1 || gravidade > 5 ||
        !Number.isInteger(urgencia) || urgencia < 1 || urgencia > 5 ||
        !Number.isInteger(tendencia) || tendencia < 1 || tendencia > 5
      ) {
        manualReview.push({
          sheet: sheetName,
          row: rowLabel,
          reason: `Gravidade/Urgência/Tendência inválida (G=${row[idx.gravidade]} U=${row[idx.urgencia]} T=${row[idx.tendencia]})`,
          title,
        });
        continue;
      }

      let status;
      let completedDate = null;
      if (statusInfo.kind === "finished") {
        // "Good"/"Concluído .../etc = concluída (confirmado pelo usuário em
        // 2026-08-14) — migra como histórico fechado, não só o trabalho aberto.
        completedDate = excelDateToISO(row[idx.realizado]);
        if (!completedDate) {
          manualReview.push({
            sheet: sheetName,
            row: rowLabel,
            reason: "Marcada como concluída na planilha, mas sem data em Realizado",
            title,
          });
          continue;
        }
        if (completedDate < startDate) {
          manualReview.push({
            sheet: sheetName,
            row: rowLabel,
            reason: `Data de Realizado (${completedDate}) anterior ao Início (${startDate})`,
            title,
          });
          continue;
        }
        status = "closed";
      } else {
        status = args.statusRule === "always-ready" ? "ready" : dueDate ? "on_going" : "ready";
      }

      const note = String(row[idx.fup] ?? "").trim();

      migrated.push({
        sheet: sheetName,
        row: rowLabel,
        owner: sheetName,
        title,
        start_date: startDate,
        due_date: dueDate ?? "",
        completed_date: completedDate ?? "",
        gravidade,
        urgencia,
        tendencia,
        priority: gravidade * urgencia * tendencia,
        status,
        note,
      });
      if (status === "closed") migratedFinished++;
      else migratedActive++;

      if (args.commit) {
        const { data: activity, error } = await supabase
          .from("activities")
          .insert({
            department_id: departmentId,
            owner_user_id: ownerId,
            name: summarizeName(title),
            title,
            start_date: startDate,
            due_date: dueDate,
            completed_date: completedDate,
            gravidade,
            urgencia,
            tendencia,
            status,
          })
          .select("id")
          .single();

        if (error || !activity) {
          manualReview.push({ sheet: sheetName, row: rowLabel, reason: `Falha no insert: ${error?.message}`, title });
          migrated.pop();
          if (status === "closed") migratedFinished--;
          else migratedActive--;
          continue;
        }

        if (note) {
          await supabase.from("activity_follow_ups").insert({
            activity_id: activity.id,
            author_user_id: ownerId,
            note,
          });
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Relatório
  // ---------------------------------------------------------------------------
  const outDir = join(__dirname, "migration-output");
  mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");

  function toCsv(rows, columns) {
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [columns.join(",")];
    for (const row of rows) lines.push(columns.map((c) => escape(row[c])).join(","));
    return lines.join("\n");
  }

  const migratedPath = join(outDir, `migrated_${ts}.csv`);
  writeFileSync(
    migratedPath,
    toCsv(migrated, [
      "sheet", "row", "owner", "title", "start_date", "due_date", "completed_date",
      "gravidade", "urgencia", "tendencia", "priority", "status", "note",
    ]),
    "utf-8"
  );

  const reviewPath = join(outDir, `manual_review_${ts}.csv`);
  writeFileSync(reviewPath, toCsv(manualReview, ["sheet", "row", "title", "reason"]), "utf-8");

  console.log(`\n=== Resumo ===`);
  console.log(`Migradas (ou prontas para migrar): ${migrated.length}`);
  console.log(`  - Abertas (ready/on_going): ${migratedActive}`);
  console.log(`  - Já concluídas na planilha, migradas como histórico: ${migratedFinished}`);
  console.log(`Em revisão manual: ${manualReview.length}`);
  console.log(`\nRelatórios salvos em:\n  ${migratedPath}\n  ${reviewPath}`);
  if (!args.commit) {
    console.log(`\nEste foi um DRY-RUN. Revise os CSVs acima e rode de novo com --commit para gravar no banco.`);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
