"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { newDepartmentSchema, type NewDepartmentValues } from "@/lib/validation/admin";
import { createDepartment } from "@/lib/actions/admin-actions";
import { useAdminErrorTranslator } from "@/lib/i18n/admin-errors";

// Faixa Unicode "Combining Diacritical Marks" (U+0300–U+036F) — construída via
// charCode em vez de literal no regex para não depender de como o editor/
// terminal representa esses caracteres combinantes.
const COMBINING_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
);

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewDepartmentTab() {
  const t = useTranslations("admin.newDepartment");
  const translateError = useAdminErrorTranslator();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewDepartmentValues>({
    resolver: zodResolver(newDepartmentSchema),
    defaultValues: { name: "", slug: "", password: "", managerName: "" },
  });

  async function submit(values: NewDepartmentValues) {
    setServerError(null);
    const result = await createDepartment(values);
    if (!result.ok) {
      setServerError(translateError(result));
      return;
    }
    toast.success(t("successToast"));
    reset();
    setSlugTouched(false);
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="dep-name">{t("name")}</Label>
            <Input
              id="dep-name"
              {...register("name", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value));
                },
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dep-slug">{t("slug")}</Label>
            <Input
              id="dep-slug"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            <p className="text-xs text-muted-foreground">{t("slugHelp")}</p>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dep-password">{t("password")}</Label>
            <Input id="dep-password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dep-manager">{t("managerName")}</Label>
            <Input id="dep-manager" {...register("managerName")} />
            {errors.managerName && (
              <p className="text-xs text-destructive">{errors.managerName.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
