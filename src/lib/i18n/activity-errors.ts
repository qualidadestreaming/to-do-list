import { useTranslations } from "next-intl";
import type { ActivityErrorCode } from "@/lib/actions/activity-actions";

export type ActivityActionResult =
  | { ok: true }
  | { ok: false; errorCode: ActivityErrorCode; validationMessage?: string };

/** Traduz o errorCode retornado pelas server actions de atividades para o idioma ativo. */
export function useActivityErrorTranslator() {
  const t = useTranslations("activities.errors");

  return (result: Extract<ActivityActionResult, { ok: false }>): string => {
    if (result.errorCode === "validation") {
      return result.validationMessage ?? t("createFailed");
    }
    const map: Record<Exclude<ActivityErrorCode, "validation">, string> = {
      session_expired: t("sessionExpired"),
      create_failed: t("createFailed"),
      update_failed: t("updateFailed"),
      start_failed: t("startFailed"),
      close_failed: t("closeFailed"),
      reopen_failed: t("reopenFailed"),
      follow_up_failed: t("followUpFailed"),
      delete_failed: t("deleteFailed"),
      reassign_failed: t("reassignFailed"),
    };
    return map[result.errorCode];
  };
}
