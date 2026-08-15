"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/admin/users-tab";
import { PasswordTab } from "@/components/admin/password-tab";
import { NewDepartmentTab } from "@/components/admin/new-department-tab";
import type { AppUser } from "@/types/database";

export function AdminView({ users }: { users: AppUser[] }) {
  const t = useTranslations("admin");

  return (
    <div className="space-y-4">
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
          <TabsTrigger value="password">{t("tabs.password")}</TabsTrigger>
          <TabsTrigger value="newDepartment">{t("tabs.newDepartment")}</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="pt-4">
          <UsersTab users={users} />
        </TabsContent>
        <TabsContent value="password" className="pt-4">
          <PasswordTab />
        </TabsContent>
        <TabsContent value="newDepartment" className="pt-4">
          <NewDepartmentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
