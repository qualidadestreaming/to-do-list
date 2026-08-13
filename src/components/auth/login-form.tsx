"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  completeLogin,
  verifyDepartmentPassword,
  type AuthErrorCode,
  type DepartmentOption,
  type DepartmentUserOption,
} from "@/lib/actions/auth-actions";

export function LoginForm({ departments }: { departments: DepartmentOption[] }) {
  const t = useTranslations();
  const [step, setStep] = useState<"department" | "user">("department");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [users, setUsers] = useState<DepartmentUserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [errorCode, setErrorCode] = useState<AuthErrorCode | "pick_user" | null>(null);
  const [isPending, startTransition] = useTransition();

  function translateError(code: AuthErrorCode | "pick_user") {
    const map: Record<AuthErrorCode | "pick_user", string> = {
      missing_fields: t("auth.missingFields"),
      invalid_credentials: t("auth.invalidCredentials"),
      generic_error: t("auth.genericError"),
      users_load_error: t("auth.usersLoadError"),
      no_users_in_department: t("auth.noUsersInDepartment"),
      session_expired: t("auth.sessionExpired"),
      confirm_error: t("auth.confirmError"),
      invalid_user: t("auth.invalidUser"),
      pick_user: t("auth.pickUser"),
    };
    return map[code];
  }

  function handleDepartmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    startTransition(async () => {
      const result = await verifyDepartmentPassword({ slug, password });
      if (!result.ok) {
        setErrorCode(result.errorCode);
        return;
      }
      setDepartmentName(result.departmentName);
      setUsers(result.users);
      setSelectedUserId(result.users[0]?.id ?? "");
      setStep("user");
    });
  }

  function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    if (!selectedUserId) {
      setErrorCode("pick_user");
      return;
    }
    startTransition(async () => {
      const result = await completeLogin({ userId: selectedUserId });
      // completeLogin só retorna em caso de erro (sucesso redireciona no servidor)
      if (result && !result.ok) {
        setErrorCode(result.errorCode);
      }
    });
  }

  if (step === "user") {
    return (
      <form onSubmit={handleUserSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">{t("auth.department")}</p>
          <p className="font-medium text-foreground">{departmentName}</p>
        </div>

        {errorCode && (
          <Alert variant="destructive">
            <AlertDescription>{translateError(errorCode)}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>{t("auth.whoAreYou")}</Label>
          <RadioGroup value={selectedUserId} onValueChange={setSelectedUserId} className="max-h-64 overflow-y-auto">
            {users.map((u) => (
              <label
                key={u.id}
                htmlFor={`user-${u.id}`}
                className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/10"
              >
                <span>{u.name}</span>
                <div className="flex items-center gap-2">
                  {u.role === "gestor" && (
                    <span className="rounded-full bg-status-ongoing px-2 py-0.5 text-xs text-status-ongoing-foreground">
                      {t("auth.manager")}
                    </span>
                  )}
                  <RadioGroupItem value={u.id} id={`user-${u.id}`} />
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setStep("department");
              setErrorCode(null);
            }}
            disabled={isPending}
          >
            {t("auth.back")}
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("auth.enter")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleDepartmentSubmit} className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
      {errorCode && (
        <Alert variant="destructive">
          <AlertDescription>{translateError(errorCode)}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="department">{t("auth.department")}</Label>
        <Select value={slug} onValueChange={setSlug} required>
          <SelectTrigger id="department" className="w-full">
            <SelectValue placeholder={t("auth.departmentPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.slug} value={d.slug}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {departments.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("auth.departmentEmpty")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {t("auth.continue")}
      </Button>
    </form>
  );
}
