"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activityFormSchema, type ActivityFormValues } from "@/lib/validation/activity";
import { computeGutPriority, getGutBand, GUT_SCALE_OPTIONS } from "@/lib/gut";
import { PriorityBadge } from "@/components/activities/priority-badge";
import { useActivityErrorTranslator, type ActivityActionResult } from "@/lib/i18n/activity-errors";
import type { AppUser } from "@/types/database";

const GUT_AXES: { key: "gravidade" | "urgencia" | "tendencia"; labelKey: "gravidade" | "urgencia" | "tendencia" }[] = [
  { key: "gravidade", labelKey: "gravidade" },
  { key: "urgencia", labelKey: "urgencia" },
  { key: "tendencia", labelKey: "tendencia" },
];

const BAND_LABEL_KEY = { low: "low", medium: "medium", high: "high" } as const;

export function ActivityForm({
  users,
  defaultValues,
  onSubmit,
  submitLabel,
  noteLabel,
}: {
  users: AppUser[];
  defaultValues?: Partial<ActivityFormValues>;
  onSubmit: (values: ActivityFormValues) => Promise<ActivityActionResult>;
  submitLabel: string;
  noteLabel?: string;
}) {
  const t = useTranslations("activities.form");
  const tGut = useTranslations("activities.gutBands");
  const translateError = useActivityErrorTranslator();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: "",
      title: "",
      ownerUserId: users[0]?.id ?? "",
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      gravidade: 1,
      urgencia: 1,
      tendencia: 1,
      note: "",
      ...defaultValues,
    },
  });

  const [gravidade, urgencia, tendencia] = watch(["gravidade", "urgencia", "tendencia"]);
  const previewPriority = computeGutPriority(
    Number(gravidade) || 1,
    Number(urgencia) || 1,
    Number(tendencia) || 1
  );

  async function submit(values: ActivityFormValues) {
    setServerError(null);
    const result = await onSubmit(values);
    if (!result.ok) setServerError(translateError(result));
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("nameLabel")}</Label>
          <Input id="name" className="rounded-lg" {...register("name")} maxLength={120} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerUserId" className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("owner")}</Label>
          <Controller
            name="ownerUserId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="ownerUserId" className="w-full rounded-lg">
                  <SelectValue placeholder={t("ownerPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.ownerUserId && (
            <p className="text-xs text-destructive">{errors.ownerUserId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("descriptionLabel")}</Label>
        <Textarea id="title" rows={3} className="rounded-lg" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("startDate")}</Label>
          <Input id="startDate" type="date" className="rounded-lg" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-xs text-destructive">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate" className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("dueDate")}</Label>
          <Input id="dueDate" type="date" className="rounded-lg" {...register("dueDate")} />
          {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-primary">{t("gutMatrix")}</Label>
        <div className="grid grid-cols-3 gap-4">
          {GUT_AXES.map((axis) => (
            <div key={axis.key} className="space-y-1">
              <span className="text-xs text-muted-foreground">{t(axis.labelKey)}</span>
              <Controller
                name={axis.key}
                control={control}
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger className="w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUT_SCALE_OPTIONS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
          {t("calculatedPriority")}
          <PriorityBadge priority={previewPriority} />
          <span className="text-xs">
            {t("bandLegend", { band: tGut(BAND_LABEL_KEY[getGutBand(previewPriority).key]) })}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-[10px] font-bold uppercase tracking-wider text-primary">{noteLabel ?? t("note")}</Label>
        <Textarea id="note" rows={2} className="rounded-lg" {...register("note")} />
      </div>

      <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
