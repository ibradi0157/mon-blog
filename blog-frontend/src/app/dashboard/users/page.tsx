"use client";
import { UsersTable } from "./components/UsersTable";

export default function DashboardUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold dark:text-slate-100">Gestion des utilisateurs</h1>
      <UsersTable />
    </div>
  );
}
