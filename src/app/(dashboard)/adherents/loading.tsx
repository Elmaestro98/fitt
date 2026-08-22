// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementAdherents() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-40 rounded-control squelette" />
      <div className="h-11 w-full max-w-xs rounded-control squelette" />
      <Card className="divide-y divide-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="size-10 shrink-0 rounded-full squelette" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded squelette" />
              <div className="h-3 w-20 rounded squelette" />
            </div>
            <div className="h-6 w-16 rounded-pill squelette" />
          </div>
        ))}
      </Card>
    </div>
  );
}
