// Squelette affiche pendant le chargement (CLAUDE.md §7).
// Next.js l'affiche automatiquement grace au nom de fichier "loading".
import { Card } from "@/components/ui/card";

export default function ChargementPointage() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-36 rounded-control bg-sunken" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="space-y-3 p-5">
              <div className="h-3 w-32 rounded bg-sunken" />
              <div className="h-7 w-16 rounded bg-sunken" />
              <div className="h-3 w-24 rounded bg-sunken" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card className="space-y-4 p-6">
          <div className="mx-auto h-5 w-40 rounded bg-sunken" />
          <div className="mx-auto h-3 w-64 rounded bg-sunken" />
          <div className="mx-auto h-14 max-w-lg rounded-control bg-sunken" />
        </Card>

        <div className="space-y-4">
          <div className="h-12 rounded-card bg-sunken" />
          <Card className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="size-8 shrink-0 rounded-full bg-sunken" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-sunken" />
                  <div className="h-3 w-12 rounded bg-sunken" />
                </div>
                <div className="h-3 w-10 rounded bg-sunken" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
