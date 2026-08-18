import { z } from "zod";

const gutScale = z.coerce.number().int().min(1).max(5);

export const activityFormSchema = z
  .object({
    name: z.string().trim().min(1, "Dê um nome curto para a atividade.").max(120),
    title: z.string().trim().min(1, "Descreva a atividade.").max(2000),
    ownerUserId: z.string().uuid("Escolha o responsável."),
    startDate: z.string().min(1, "Informe a data de início."),
    dueDate: z.string().optional().or(z.literal("")),
    gravidade: gutScale,
    urgencia: gutScale,
    tendencia: gutScale,
    note: z.string().trim().max(2000).optional().or(z.literal("")),
    // Status e data de conclusão viajam junto com o resto do formulário: os
    // botões Iniciar/Concluir/Reabrir só marcam a intenção na tela, quem
    // grava é o "Salvar alterações" (ver activity-detail-dialog.tsx).
    status: z.enum(["ready", "on_going", "closed"]).optional(),
    completedDate: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !data.dueDate || data.dueDate >= data.startDate, {
    message: "O prazo não pode ser antes do início.",
    path: ["dueDate"],
  })
  // A tabela tem constraint (activities_completed_date_matches_status): toda
  // atividade fechada precisa de data de conclusão. Barrar aqui dá mensagem
  // legível em vez de erro cru do Postgres.
  .refine((data) => data.status !== "closed" || Boolean(data.completedDate), {
    message: "Informe a data de conclusão.",
    path: ["completedDate"],
  })
  .refine(
    (data) => !data.completedDate || data.completedDate >= data.startDate,
    {
      message: "A conclusão não pode ser antes do início.",
      path: ["completedDate"],
    }
  );

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export const followUpSchema = z.object({
  activityId: z.string().uuid(),
  note: z.string().trim().min(1, "Escreva uma atualização.").max(2000),
});
