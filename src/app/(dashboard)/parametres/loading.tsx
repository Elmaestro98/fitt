// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementParametres() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-40 rounded-control bg-sunken" />

      <Card>
        <div className="space-y-4 p-5">
          <div className="h-4 w-52 rounded bg-sunken" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-sunken" />
              <div className="h-11 w-full rounded-control bg-sunken" />
            </div>
          ))}
          <div className="h-11 w-32 rounded-control bg-sunken" />
        </div>
      </Card>

      <Card>
        <div className="space-y-3 p-5">
          <div className="h-4 w-44 rounded bg-sunken" />
          <div className="h-3 w-full rounded bg-sunken" />
          <div className="h-3 w-3/4 rounded bg-sunken" />
        </div>
      </Card>
    </div>
  );
}
