"use client";
import { UsersTable } from "./components/UsersTable";

export default function DashboardUsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Gestion des utilisateurs</h1>
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        Gérer les rôles et les autorisations des utilisateurs. Promouvoir, rétrograder ou supprimer des comptes.
      </p>
      <div className="border rounded-lg p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <UsersTable />
      </div>
    </div>
  );
}
