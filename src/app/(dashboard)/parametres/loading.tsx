// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementParametres() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-40 rounded-control squelette" />

      <Card>
        <div className="space-y-4 p-5">
          <div className="h-4 w-52 rounded squelette" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded squelette" />
              <div className="h-11 w-full rounded-control squelette" />
            </div>
          ))}
          <div className="h-11 w-32 rounded-control squelette" />
        </div>
      </Card>

      <Card>
        <div className="space-y-3 p-5">
          <div className="h-4 w-44 rounded squelette" />
          <div className="h-3 w-full rounded squelette" />
          <div className="h-3 w-3/4 rounded squelette" />
        </div>
      </Card>
    </div>
  );
}
