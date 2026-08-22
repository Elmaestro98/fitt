// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementPointage() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-36 rounded-control squelette" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="space-y-3 p-5">
              <div className="h-3 w-32 rounded squelette" />
              <div className="h-7 w-16 rounded squelette" />
              <div className="h-3 w-24 rounded squelette" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card className="space-y-4 p-6">
          <div className="mx-auto h-5 w-40 rounded squelette" />
          <div className="mx-auto h-3 w-64 rounded squelette" />
          <div className="mx-auto h-14 max-w-lg rounded-control squelette" />
        </Card>

        <div className="space-y-4">
          <div className="h-12 rounded-card squelette" />
          <Card className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="size-8 shrink-0 rounded-full squelette" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded squelette" />
                  <div className="h-3 w-12 rounded squelette" />
                </div>
                <div className="h-3 w-10 rounded squelette" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
