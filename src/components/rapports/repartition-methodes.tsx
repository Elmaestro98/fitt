"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shadcn/chart";
import { formatFCFA } from "@/lib/utils/format";
import type { MethodePaiement } from "@/generated/prisma/enums";

const LIBELLES: Record<MethodePaiement, string> = {
  ESPECES: "Especes",
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
};

/* Memes teintes de graphique que RepartitionFormules (tableau de bord) :
   coherence visuelle entre les deux camemberts de l'application. */
const TEINTES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
];

export function RepartitionMethodes({
  lignes,
  total,
}: {
  lignes: { methode: MethodePaiement; montant: number; pourcentage: number }[];
  total: number;
}) {
  const donnees = lignes.map((l) => ({ ...l, nom: LIBELLES[l.methode] }));

  const config = Object.fromEntries(
    donnees.map((l, i) => [
      l.methode,
      { label: l.nom, color: TEINTES[i % TEINTES.length] },
    ]),
  ) satisfies ChartConfig;

  return (
    <div>
      <div className="relative">
        <ChartContainer config={config} className="mx-auto h-44 w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="nom"
                  formatter={(valeur) => formatFCFA(Number(valeur))}
                />
              }
            />
            <Pie
              data={donnees}
              dataKey="montant"
              nameKey="nom"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              strokeWidth={0}
            >
              {donnees.map((l, i) => (
                <Cell key={l.methode} fill={TEINTES[i % TEINTES.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="text-lg font-bold text-ink tabular-nums">
            {formatFCFA(total)}
          </span>
          <span className="text-xs tracking-wide text-muted uppercase">
            Encaisse
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {donnees.map((l, i) => (
          <li key={l.methode} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: TEINTES[i % TEINTES.length] }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-ink">{l.nom}</span>
            <span className="text-muted tabular-nums">{l.pourcentage} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
