import { useTranslations } from "next-intl";
import type { AdminErrorCode } from "@/lib/actions/admin-actions";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; errorCode: AdminErrorCode; validationMessage?: string };

export function useAdminErrorTranslator() {
  const t = useTranslations("admin.errors");

  return (result: Extract<AdminActionResult, { ok: false }>): string => {
    if (result.errorCode === "validation") {
      return result.validationMessage ?? t("createUserFailed");
    }
    const map: Record<Exclude<AdminErrorCode, "validation">, string> = {
      forbidden: t("forbidden"),
      session_expired: t("sessionExpired"),
      create_user_failed: t("createUserFailed"),
      update_user_failed: t("updateUserFailed"),
      change_password_failed: t("changePasswordFailed"),
      create_department_failed: t("createDepartmentFailed"),
      slug_taken: t("slugTaken"),
    };
    return map[result.errorCode];
  };
}
