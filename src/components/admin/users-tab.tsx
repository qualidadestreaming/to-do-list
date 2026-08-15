"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  editUserSchema,
  newUserSchema,
  type EditUserValues,
  type NewUserValues,
} from "@/lib/validation/admin";
import { createDepartmentUser, deleteDepartmentUser, updateDepartmentUser } from "@/lib/actions/admin-actions";
import { useAdminErrorTranslator } from "@/lib/i18n/admin-errors";
import type { AppUser } from "@/types/database";

function NewUserDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const t = useTranslations("admin.users");
  const translateError = useAdminErrorTranslator();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", role: "colaborador" },
  });

  async function submit(values: NewUserValues) {
    setServerError(null);
    const result = await createDepartmentUser(values);
    if (!result.ok) {
      setServerError(translateError(result));
      return;
    }
    toast.success(t("createdToast"));
    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fitted className="gap-0 sm:max-w-md">
        <DialogHeader className="static mx-0 mt-0 gap-1.5 border-b bg-transparent px-6 pt-6 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("newUserEyebrow")}
          </p>
          <DialogTitle className="pr-8 text-base font-bold">{t("newUser")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4 px-6 py-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("name")}</Label>
            <Input id="name" className="rounded-lg" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("role")}</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colaborador">{t("roleColaborador")}</SelectItem>
                    <SelectItem value="gestor">{t("roleGestor")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t("create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: AppUser;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const t = useTranslations("admin.users");
  const translateError = useAdminErrorTranslator();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, role: user.role, active: user.active },
  });

  async function submit(values: EditUserValues) {
    setServerError(null);
    const result = await updateDepartmentUser(user.id, values);
    if (!result.ok) {
      setServerError(translateError(result));
      return;
    }
    toast.success(t("updatedToast"));
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fitted className="gap-0 sm:max-w-md">
        <DialogHeader className="static mx-0 mt-0 gap-1.5 border-b bg-transparent px-6 pt-6 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("editUserEyebrow")}
          </p>
          <DialogTitle className="pr-8 text-base font-bold">{user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4 px-6 py-6">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("name")}</Label>
            <Input id="edit-name" className="rounded-lg" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("role")}</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colaborador">{t("roleColaborador")}</SelectItem>
                    <SelectItem value="gestor">{t("roleGestor")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="active" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("active")}</Label>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersTab({ users }: { users: AppUser[] }) {
  const t = useTranslations("admin.users");
  const translateError = useAdminErrorTranslator();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(user: AppUser) {
    if (!confirm(t("confirmDelete", { name: user.name }))) return;
    setDeletingId(user.id);
    const result = await deleteDepartmentUser(user.id);
    setDeletingId(null);
    if (!result.ok) {
      toast.error(translateError(result));
      return;
    }
    toast.success(t("deletedToast"));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t("newUser")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("role")}</th>
              <th className="px-4 py-3">{t("active")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.role === "gestor" ? t("roleGestor") : t("roleColaborador")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.active ? t("active") : t("inactive")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingUser(u)}>
                      {t("edit")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === u.id}
                      onClick={() => handleDelete(u)}
                    >
                      {deletingId === u.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon={Users} message={t("noUsers")} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={router.refresh} />
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={Boolean(editingUser)}
          onOpenChange={(v) => !v && setEditingUser(null)}
          onSaved={router.refresh}
        />
      )}
    </div>
  );
}
