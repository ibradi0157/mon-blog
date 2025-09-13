"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { Plus, Save, RotateCcw, Trash2, Edit3, Check, X } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

type KV = { key: string; value: string };

function makeStorageKey(userId?: string) {
  return `member:settings:${userId ?? "anon"}`;
}

function loadSettings(userId?: string): KV[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(makeStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((r) => r && typeof r.key === "string")
        .map((r) => ({ key: String(r.key), value: String(r.value ?? "") }));
    }
    return [];
  } catch {
    return [];
  }
}

function saveSettings(userId: string | undefined, rows: KV[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(makeStorageKey(userId), JSON.stringify(rows));
  } catch {}
}

export default function MemberSettingsPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const storageKey = useMemo(() => makeStorageKey(userId), [userId]);

  const [rows, setRows] = useState<KV[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<KV>({ key: "", value: "" });
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Load on mount and when user changes
  useEffect(() => {
    setRows(loadSettings(userId));
    setDirty(false);
    setEditingIndex(null);
    setError(null);
  }, [storageKey, userId]);

  // Simple validation
  const validate = (items: KV[]): string | null => {
    for (const r of items) {
      if (!r.key.trim()) return "La clé ne peut pas être vide";
    }
    const keys = items.map((r) => r.key.trim());
    const unique = new Set(keys);
    if (unique.size !== keys.length) return "Les clés doivent être uniques";
    return null;
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft(rows[index]);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft({ key: "", value: "" });
    setError(null);
  };

  const commitEdit = () => {
    if (editingIndex === null) return;
    const next = rows.slice();
    next[editingIndex] = { ...draft, key: draft.key.trim() };
    const err = validate(next);
    if (err) {
      setError(err);
      return;
    }
    setRows(next);
    setEditingIndex(null);
    setDraft({ key: "", value: "" });
    setDirty(true);
  };

  const addRow = () => {
    const next = [...rows, { key: "nouvelle_cle", value: "" }];
    const err = validate(next);
    if (err) {
      setError(err);
      return;
    }
    setRows(next);
    setDirty(true);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    const err = validate(next);
    if (err) {
      setError(err);
      return;
    }
    setRows(next);
    setDirty(true);
  };

  const onSave = () => {
    const err = validate(rows);
    if (err) {
      setError(err);
      return;
    }
    saveSettings(userId, rows);
    setDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const onReset = () => {
    setRows(loadSettings(userId));
    setDirty(false);
    setEditingIndex(null);
    setDraft({ key: "", value: "" });
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Paramètres</h2>
          <p className="text-slate-600 dark:text-slate-400">Gérez vos paramètres personnels (stockés localement)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4" /> Réinitialiser
          </Button>
          <Button onClick={onSave} disabled={!dirty}>
            <Save className="w-4 h-4" /> Enregistrer
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {justSaved && (
        <div className="p-2 rounded-md border border-green-200 bg-green-50 text-green-700 w-max dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          Modifications enregistrées
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Clé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Valeur</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Aucun paramètre</td>
                </tr>
              )}
              {rows.map((row, i) => {
                const isEditing = editingIndex === i;
                return (
                  <tr key={`${row.key}-${i}`} className="group">
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <Input
                          value={draft.key}
                          onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                        />
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-white">{row.key}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {isEditing ? (
                        <Input
                          value={draft.value}
                          onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                        />
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">{row.value}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-2">
                          <Button size="sm" onClick={commitEdit}>
                            <Check className="w-4 h-4" /> Valider
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            <X className="w-4 h-4" /> Annuler
                          </Button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 opacity-80 group-hover:opacity-100">
                          <Button size="sm" variant="outline" onClick={() => startEdit(i)}>
                            <Edit3 className="w-4 h-4" /> Éditer
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => removeRow(i)}>
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
          <Button onClick={addRow} size="sm">
            <Plus className="w-4 h-4" /> Ajouter un paramètre
          </Button>
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Ces paramètres sont stockés localement dans votre navigateur (clé: <code>{storageKey}</code>).
      </div>
    </div>
  );
}
