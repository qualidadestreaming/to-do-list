#!/usr/bin/env node
/**
 * Backfill do campo activities.name (Fase 5.1) para atividades migradas da
 * planilha que só tinham a descrição longa em `title`.
 *
 * Heurística (não é leitura humana linha a linha — mecânica, sobre ~1400
 * linhas isso não é viável manualmente): pega o primeiro trecho do título
 * antes de marcadores de ruído comuns na planilha original ("Email :",
 * "SPM :", quebra de linha), e corta em ~70 caracteres no limite de palavra
 * se ainda estiver longo.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_LEN = 70;

function summarize(title) {
  let s = String(title ?? "").trim();
  // corta em marcadores de ruído comuns
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

async function main() {
  let updated = 0;
  const pageSize = 500;

  // Sempre busca do início (range 0..pageSize) — as linhas já atualizadas
  // saem do filtro "name is null", então a "próxima página" é sempre a
  // mesma janela inicial até não sobrar nenhuma.
  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("id, title")
      .is("name", null)
      .range(0, pageSize - 1);

    if (error) {
      console.error("Erro ao buscar:", error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const name = summarize(row.title);
      const { error: updError } = await supabase
        .from("activities")
        .update({ name })
        .eq("id", row.id);
      if (updError) {
        console.error(`Falha ao atualizar ${row.id}:`, updError.message);
        continue;
      }
      updated++;
    }
    console.log(`Processadas ${updated} até agora...`);
    if (data.length < pageSize) break;
  }

  console.log(`\nTotal atualizado: ${updated}`);
}

main();
