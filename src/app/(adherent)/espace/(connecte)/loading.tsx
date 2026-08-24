// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading", pour
// TOUTE page du groupe (connecte) — sa forme reprend celle de l'accueil,
// l'ecran le plus visite, plutot que de rester generique au point de ne rien
// evoquer.
import { Card, CardBody } from "@/components/ui/card";

export default function ChargementEspace() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="squelette h-7 w-48 rounded-control" />
        <div className="squelette h-4 w-32 rounded-control" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="flex flex-col items-center gap-3 py-10">
            <div className="squelette h-3 w-24 rounded-control" />
            <div className="squelette h-14 w-20 rounded-control" />
            <div className="squelette h-3 w-40 rounded-control" />
          </CardBody>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="space-y-3 pt-5">
                <div className="squelette h-3 w-20 rounded-control" />
                <div className="squelette h-8 w-16 rounded-control" />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody className="flex items-center gap-3 py-4">
              <div className="squelette size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="squelette h-3 w-24 rounded-control" />
                <div className="squelette h-3 w-16 rounded-control" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
