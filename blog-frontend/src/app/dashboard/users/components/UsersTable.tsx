"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeUserRole, createUser, deleteUser, listUsers, purgeMembers, type User } from "@/app/services/users";
import { useAuth } from "@/app/providers/AuthProvider";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";

export function UsersTable() {
  const qc = useQueryClient();
  const { user: me } = useAuth();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<"list" | "grid">(() => {
    if (typeof window === "undefined") return "list";
    try { return (localStorage.getItem("admin:users:view") as any) || "list"; } catch { return "list"; }
  });
  useEffect(() => {
    try { localStorage.setItem("admin:users:view", view); } catch {}
  }, [view]);

  const show = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const listQ = useQuery<{ success: boolean; data: User[]; pagination: { total: number; page: number; limit: number; pages: number } }>({
    queryKey: ["admin-users", { page, limit, search }],
    queryFn: () => listUsers({ page, limit, search: search || undefined, sort: "createdAt", order: "DESC" }),
    placeholderData: (prev) => prev,
  });
  const users = (listQ.data?.data ?? []) as User[];
  const isSecondaryAdmin = me?.role === "SECONDARY_ADMIN";
  const visibleUsers = isSecondaryAdmin
    ? users.filter((u) => {
        const role = u.role?.name || "SIMPLE_USER";
        return role === "MEMBER" || role === "SIMPLE_USER";
      })
    : users;
  const pagination = listQ.data?.pagination ?? { page: 1, pages: 1, total: 0, limit };

  const createMut = useMutation({
    mutationFn: (payload: { email: string; displayName: string; password: string; confirmPassword: string }) => createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      show("success", "Utilisateur créé");
    },
    onError: (e: any) => show("error", e?.message || "Échec de la création"),
  });

  const roleMut = useMutation({
    mutationFn: (vars: { id: string; to: "SECONDARY_ADMIN" | "MEMBER" }) => changeUserRole(vars.id, vars.to),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      show("success", "Rôle mis à jour");
    },
    onError: (e: any) => show("error", e?.message || "Échec de la mise à jour du rôle"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      show("success", "Utilisateur supprimé");
    },
    onError: (e: any) => show("error", e?.message || "Échec de la suppression"),
  });

  const purgeMut = useMutation({
    mutationFn: () => purgeMembers(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      show("success", `Membres supprimés: ${res?.deleted ?? 0}`);
    },
    onError: (e: any) => show("error", e?.message || "Échec du nettoyage"),
  });

  const loadingAny = listQ.isLoading || createMut.isPending || roleMut.isPending || delMut.isPending || purgeMut.isPending;

  return (
    <div className="space-y-3">
      {notice && (
        <div className={`p-2 rounded text-sm ${notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{notice.text}</div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par email ou nom..."
            className="flex-1 min-w-0"
          />
          <Button variant="primary" onClick={() => setShowCreate((v) => !v)} disabled={loadingAny}>
            {showCreate ? "Fermer" : "Nouvel utilisateur"}
          </Button>
          {me?.role === "PRIMARY_ADMIN" && (
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm("Confirmer la suppression de tous les MEMBERS ?")) purgeMut.mutate();
              }}
              disabled={loadingAny}
              title="Supprimer tous les utilisateurs MEMBER"
            >
              Purger les MEMBERS
            </Button>
          )}
          <div className="hidden sm:flex items-center gap-1 ml-auto">
            <Button variant={view === "list" ? "secondary" : "outline"} size="sm" onClick={() => setView("list")}>Liste</Button>
            <Button variant={view === "grid" ? "secondary" : "outline"} size="sm" onClick={() => setView("grid")}>Grille</Button>
          </div>
        </div>
        {showCreate && (
          <div className="border rounded p-3 bg-black/5 dark:bg:white/5 dark:border-slate-700">
            <CreateUserForm
              onCreate={(p) => {
                createMut.mutate(p);
                setShowCreate(false);
              }}
              disabled={loadingAny}
            />
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {listQ.isLoading && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`u-skel-${i}`} className="border rounded p-3 animate-pulse space-y-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="h-4 w-2/3 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
              <div className="h-3 w-1/3 bg-black/10 dark:bg-white/10 rounded" />
            </div>
          ))
        )}
        {!listQ.isLoading && visibleUsers.map((u) => {
          const role = u.role?.name || "SIMPLE_USER";
          const isPrimary = role === "PRIMARY_ADMIN";
          const isSecondary = role === "SECONDARY_ADMIN";
          const isSelf = u.id === (me?.id || "");
          return (
            <div key={u.id} className="border rounded p-3 space-y-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.displayName || "—"}</div>
                  <div className="text-xs opacity-80 truncate">{u.email}</div>
                </div>
                <div className="shrink-0">
                  <Badge variant="neutral">{role}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  {u.isActive ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="muted">Inactif</Badge>
                  )}
                </div>
                <div className="opacity-70">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {me?.role === "PRIMARY_ADMIN" && !isPrimary && !isSecondary && (
                  <Button variant="primary" size="sm" disabled={loadingAny} onClick={() => roleMut.mutate({ id: u.id, to: "SECONDARY_ADMIN" })}>Promouvoir admin secondaire</Button>
                )}
                {isSecondary && (
                  <Button variant="warning" size="sm" disabled={loadingAny} onClick={() => roleMut.mutate({ id: u.id, to: "MEMBER" })}>Destituer en MEMBER</Button>
                )}
                {!isPrimary && !isSelf && (
                  <Button variant="danger" size="sm" disabled={loadingAny} onClick={() => { if (window.confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) delMut.mutate(u.id); }}>Supprimer</Button>
                )}
                {isSelf && (
                  <span className="text-xs opacity-60" title="Vous ne pouvez pas vous supprimer">—</span>
                )}
              </div>
            </div>
          );
        })}
        {!listQ.isLoading && users.length === 0 && (
          <div className="p-4 text-sm opacity-70 text-center border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Aucun utilisateur trouvé.</div>
        )}
      </div>

      {/* Desktop: list or grid */}
      {view === "list" ? (
        <div className="hidden sm:block overflow-x-auto border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/10 text-left border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2">Utilisateur</th>
                <th className="p-2">Email</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Actif</th>
                <th className="p-2">Créé le</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  meId={me?.id || ""}
                  onPromote={() => roleMut.mutate({ id: u.id, to: "SECONDARY_ADMIN" })}
                  onDemote={() => roleMut.mutate({ id: u.id, to: "MEMBER" })}
                  onDelete={() => {
                    if (window.confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) delMut.mutate(u.id);
                  }}
                  loading={loadingAny}
                />
              ))}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 opacity-70">Aucun utilisateur trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleUsers.map((u) => {
            const role = u.role?.name || "SIMPLE_USER";
            const isPrimary = role === "PRIMARY_ADMIN";
            const isSecondary = role === "SECONDARY_ADMIN";
            const isSelf = u.id === (me?.id || "");
            return (
              <motion.div
                key={u.id}
                className="border rounded p-3 space-y-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.displayName || "—"}</div>
                    <div className="text-xs opacity-80 truncate">{u.email}</div>
                  </div>
                  <Badge variant="neutral">{role}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    {u.isActive ? <Badge variant="success">Actif</Badge> : <Badge variant="muted">Inactif</Badge>}
                  </div>
                  <div className="opacity-70">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {me?.role === "PRIMARY_ADMIN" && !isPrimary && !isSecondary && (
                    <Button variant="primary" size="sm" disabled={loadingAny} onClick={() => roleMut.mutate({ id: u.id, to: "SECONDARY_ADMIN" })}>Promouvoir admin secondaire</Button>
                  )}
                  {isSecondary && (
                    <Button variant="warning" size="sm" disabled={loadingAny} onClick={() => roleMut.mutate({ id: u.id, to: "MEMBER" })}>Destituer en MEMBER</Button>
                  )}
                  {!isPrimary && !isSelf && (
                    <Button variant="danger" size="sm" disabled={loadingAny} onClick={() => { if (window.confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) delMut.mutate(u.id); }}>Supprimer</Button>
                  )}
                  {isSelf && <span className="text-xs opacity-60" title="Vous ne pouvez pas vous supprimer">—</span>}
                </div>
              </motion.div>
            );
          })}
          {visibleUsers.length === 0 && (
            <div className="col-span-full p-4 text-sm opacity-70 text-center border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">Aucun utilisateur trouvé.</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="opacity-70 text-slate-700 dark:text-slate-400">Page {pagination.page} / {pagination.pages} — {pagination.total} éléments</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Précédent</button>
          <button disabled={pagination.pages <= page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Suivant</button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, meId, onPromote, onDemote, onDelete, loading }: {
  u: User;
  meId: string;
  onPromote: () => void;
  onDemote: () => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const role = u.role?.name || "SIMPLE_USER";
  const isPrimary = role === "PRIMARY_ADMIN";
  const isSecondary = role === "SECONDARY_ADMIN";
  const isMember = role === "MEMBER";

  return (
    <tr className="border-t dark:border-slate-700">
      <td className="p-2 align-top">
        <div className="font-medium">{u.displayName || "—"}</div>
      </td>
      <td className="p-2 align-top">
        <div className="opacity-90">{u.email}</div>
      </td>
      <td className="p-2 align-top">
        <Badge variant="neutral">{role}</Badge>
      </td>
      <td className="p-2 align-top">
        {u.isActive ? <Badge variant="success">Actif</Badge> : <Badge variant="muted">Inactif</Badge>}
      </td>
      <td className="p-2 align-top">
        <div className="text-xs opacity-80">{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</div>
      </td>
      <td className="p-2 align-top">
        <div className="flex flex-wrap gap-2 items-center">
          {!isPrimary && !isSecondary && (
            <Button variant="primary" size="sm" disabled={loading} onClick={onPromote}>Promouvoir admin secondaire</Button>
          )}
          {isSecondary && (
            <Button variant="warning" size="sm" disabled={loading} onClick={onDemote}>Destituer en MEMBER</Button>
          )}
          {!isPrimary && u.id !== meId && (
            <Button variant="danger" size="sm" disabled={loading} onClick={onDelete}>Supprimer</Button>
          )}
          {u.id === meId && (
            <span className="text-xs opacity-60" title="Vous ne pouvez pas vous supprimer">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function CreateUserForm({ onCreate, disabled }: { onCreate: (p: { email: string; displayName: string; password: string; confirmPassword: string }) => void; disabled: boolean }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const canCreate = email.includes("@") && displayName.trim().length > 1 && password.length >= 6 && password === confirmPassword;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canCreate || disabled) return;
        onCreate({ email: email.trim(), displayName: displayName.trim(), password, confirmPassword });
        setEmail("");
        setDisplayName("");
        setPassword("");
        setConfirmPassword("");
      }}
      className="grid grid-cols-1 sm:grid-cols-5 gap-2"
    >
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="px-3 py-2 border rounded w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400" />
      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="nom d'affichage" className="px-3 py-2 border rounded w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mot de passe (≥ 6)" type="password" className="px-3 py-2 border rounded w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400" />
      <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="confirmer le mot de passe" type="password" className="px-3 py-2 border rounded w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400" />
      <button type="submit" disabled={!canCreate || disabled} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60 w-full">Ajouter</button>
    </form>
  );
}
