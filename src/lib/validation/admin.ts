import { z } from "zod";

export const newUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  role: z.enum(["colaborador", "gestor"]),
});
export type NewUserValues = z.infer<typeof newUserSchema>;

export const editUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  role: z.enum(["colaborador", "gestor"]),
  active: z.boolean(),
});
export type EditUserValues = z.infer<typeof editUserSchema>;

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(4, "Mínimo de 4 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const newDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do departamento.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Informe o identificador.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
  password: z.string().min(4, "Mínimo de 4 caracteres."),
  managerName: z.string().trim().min(1, "Informe o nome do primeiro gestor.").max(200),
});
export type NewDepartmentValues = z.infer<typeof newDepartmentSchema>;
