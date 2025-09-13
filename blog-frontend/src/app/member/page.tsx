import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { FileText, MessageSquare, User, Settings as Cog } from "lucide-react";

export default function MemberHomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Espace Membre</h1>
        <p className="opacity-80">Bienvenue dans votre espace personnel.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Mes articles</h2>
              <p className="text-sm opacity-80">Lister, créer et gérer vos articles.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/member/articles" className="px-3 py-2 rounded border">Voir</Link>
            <Link href="/member/articles/new" className="px-3 py-2 rounded bg-blue-600 text-white">Nouveau</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Mes commentaires</h2>
              <p className="text-sm opacity-80">Historique et modération personnelle.</p>
            </div>
          </div>
          <div>
            <Link href="/member/comments" className="px-3 py-2 rounded border">Ouvrir</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Profil</h2>
              <p className="text-sm opacity-80">Informations publiques et sociales.</p>
            </div>
          </div>
          <div>
            <Link href="/member/profile" className="px-3 py-2 rounded border">Gérer</Link>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center">
              <Cog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Paramètres</h2>
              <p className="text-sm opacity-80">Préférences et sécurité du compte.</p>
            </div>
          </div>
          <div>
            <Link href="/member/settings" className="px-3 py-2 rounded border">Configurer</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
