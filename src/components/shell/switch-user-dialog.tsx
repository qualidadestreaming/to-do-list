"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  fetchDepartmentUsersForSwitch,
  switchUser,
  type AuthErrorCode,
  type DepartmentUserOption,
} from "@/lib/actions/auth-actions";

export function SwitchUserDialog({
  open,
  onOpenChange,
  departmentName,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentName: string;
  currentUserId: string;
}) {
  const t = useTranslations();
  const [users, setUsers] = useState<DepartmentUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(currentUserId);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setSelected(currentUserId);
    setErrorCode(null);
    setLoading(true);
    fetchDepartmentUsersForSwitch()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [open, currentUserId]);

  function translateError(code: AuthErrorCode) {
    const map: Record<AuthErrorCode, string> = {
      missing_fields: t("auth.missingFields"),
      invalid_credentials: t("auth.invalidCredentials"),
      generic_error: t("auth.genericError"),
      users_load_error: t("auth.usersLoadError"),
      no_users_in_department: t("auth.noUsersInDepartment"),
      session_expired: t("auth.sessionExpired"),
      confirm_error: t("auth.confirmError"),
      invalid_user: t("auth.invalidUser"),
    };
    return map[code];
  }

  function handleConfirm() {
    if (!selected || selected === currentUserId) {
      onOpenChange(false);
      return;
    }
    setErrorCode(null);
    startTransition(async () => {
      const result = await switchUser(selected);
      if (result && !result.ok) setErrorCode(result.errorCode);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("switchUser.title")}</DialogTitle>
          <DialogDescription>
            {t("switchUser.subtitle", { department: departmentName })}
          </DialogDescription>
        </DialogHeader>

        {errorCode && (
          <Alert variant="destructive">
            <AlertDescription>{translateError(errorCode)}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <RadioGroup value={selected} onValueChange={setSelected} className="max-h-72 overflow-y-auto">
            {users.map((u) => (
              <label
                key={u.id}
                htmlFor={`switch-user-${u.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/10"
              >
                <span>{u.name}</span>
                <div className="flex items-center gap-2">
                  {u.role === "gestor" && (
                    <span className="rounded-full bg-status-ongoing px-2 py-0.5 text-xs text-status-ongoing-foreground">
                      {t("auth.manager")}
                    </span>
                  )}
                  <RadioGroupItem value={u.id} id={`switch-user-${u.id}`} />
                </div>
              </label>
            ))}
          </RadioGroup>
        )}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            {t("switchUser.cancel")}
          </Button>
          <Button type="button" className="flex-1" disabled={isPending || loading} onClick={handleConfirm}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("switchUser.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
