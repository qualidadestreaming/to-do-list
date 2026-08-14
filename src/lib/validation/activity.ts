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
  })
  .refine((data) => !data.dueDate || data.dueDate >= data.startDate, {
    message: "O prazo não pode ser antes do início.",
    path: ["dueDate"],
  });

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export const closeActivitySchema = z.object({
  activityId: z.string().uuid(),
  completedDate: z.string().min(1, "Informe a data de conclusão."),
});

export const followUpSchema = z.object({
  activityId: z.string().uuid(),
  note: z.string().trim().min(1, "Escreva uma atualização.").max(2000),
});
