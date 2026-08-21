// Habillage de tout /admin — la vue AFRICATECHNOLOGIE sur les salles clientes.
//
// /!\ C'est ICI, une fois pour toutes les pages du dossier, que l'acces est
// verifie. Le meme raisonnement que (dashboard) avec getTenantContext() et
// (adherent) avec exigerSessionAdherent() : une page ajoutee demain sous
// /admin est protegee sans que personne ait a y repenser.
//
// Un echec ne redirige nulle part : rediriger vers /tableau-de-bord
// supposerait que la personne appartient a une salle, ce qui n'est pas garanti
// pour un compte qui n'est ni gerant ni Super Admin. On affiche un ecran sur
// place, sans avoir lu la moindre donnee de salle.
//
// Identite visuelle volontairement distincte du reste de l'app (voir le bloc
// "Console Super Admin" dans globals.css) : c'est un outil interne, jamais vu
// par une salle cliente. JetBrains Mono est charge ICI, pas dans le layout
// racine — le reste du produit reste en Inter seul.
import { JetBrains_Mono } from "next/font/google";
import { ShieldAlert } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSuperAdminContext } from "@/lib/super-admin";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await getSuperAdminContext();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <Card className="max-w-sm">
          <CardBody className="space-y-3 py-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sunken">
              <ShieldAlert className="size-6 text-muted" />
            </span>
            <h1 className="font-semibold text-ink">Acces refuse</h1>
            <p className="text-sm text-muted">
              Cet espace est reserve a l&apos;equipe AFRICATECHNOLOGIE.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={jetbrainsMono.variable}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
