"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  createCategory,
  deleteCategory,
  type Category,
} from "@/app/services/articles";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";

export default function DashboardCategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const show = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 2500);
  };

  const listQ = useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    placeholderData: (prev) => prev,
  });
  const categories = (listQ.data?.data ?? []) as Category[];

  const createMut = useMutation({
    mutationFn: (n: string) => createCategory(n.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      show("success", "Catégorie créée");
      setName("");
    },
    onError: (err: any) => {
      show("error", err?.message || "Impossible de créer la catégorie");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["categories"] });
      const prev = qc.getQueryData<{ success: boolean; data: Category[] }>([
        "categories",
      ]);
      qc.setQueryData([
        "categories",
      ] as any, (old: { success: boolean; data: Category[] } | undefined) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((c) => c.id !== id) };
      });
      return { prev } as { prev?: { success: boolean; data: Category[] } };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["categories"], ctx.prev);
      show("error", "Échec de la suppression");
    },
    onSuccess: () => {
      show("success", "Catégorie supprimée");
    },
  });

  const onCreate = () => {
    if (!name.trim()) return;
    createMut.mutate(name);
  };

  const onDelete = (id: string) => {
    if (!id) return;
    if (window.confirm("Supprimer cette catégorie ?")) {
      deleteMut.mutate(id);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Gestion des catégories</h1>
      </div>

      {notice && (
        <div className={`p-2 rounded text-sm ${notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {notice.text}
        </div>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la catégorie"
            className="w-full sm:max-w-md text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") onCreate();
            }}
            disabled={createMut.isPending}
          />
          <Button onClick={onCreate} disabled={createMut.isPending || !name.trim()}>
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/10 text-left">
                <tr>
                  <th className="p-3 sm:p-2">Nom</th>
                  <th className="p-3 sm:p-2 w-24 sm:w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listQ.isPending && (
                  <tr>
                    <td className="p-3 sm:p-2" colSpan={2}>
                      <div className="h-4 w-32 sm:w-48 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                    </td>
                  </tr>
                )}

                {!listQ.isPending && categories.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 sm:p-2 align-top">
                      <span className="font-medium text-sm sm:text-base">{c.name}</span>
                    </td>
                    <td className="p-3 sm:p-2 align-top">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(c.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Supprimer</span>
                      </Button>
                    </td>
                  </tr>
                ))}

                {!listQ.isPending && categories.length === 0 && (
                  <tr>
                    <td className="p-4 text-sm opacity-70 text-center" colSpan={2}>
                      Aucune catégorie.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
