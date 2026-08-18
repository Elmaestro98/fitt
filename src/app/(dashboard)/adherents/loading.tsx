// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementAdherents() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-40 rounded-control bg-sunken" />
      <div className="h-11 w-full max-w-xs rounded-control bg-sunken" />
      <Card className="divide-y divide-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="size-10 shrink-0 rounded-full bg-sunken" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-sunken" />
              <div className="h-3 w-20 rounded bg-sunken" />
            </div>
            <div className="h-6 w-16 rounded-pill bg-sunken" />
          </div>
        ))}
      </Card>
    </div>
  );
}
