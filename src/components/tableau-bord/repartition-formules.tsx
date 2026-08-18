"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shadcn/chart";

/* Les 5 teintes de graphique definies dans globals.css. Au-dela, on boucle :
   mieux vaut repeter une couleur que d'en inventer une hors charte. */
const TEINTES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function RepartitionFormules({
  lignes,
  total,
}: {
  lignes: { nom: string; nombre: number; pourcentage: number }[];
  total: number;
}) {
  const config = Object.fromEntries(
    lignes.map((l, i) => [
      l.nom,
      { label: l.nom, color: TEINTES[i % TEINTES.length] },
    ]),
  ) satisfies ChartConfig;

  return (
    <div>
      <div className="relative">
        <ChartContainer config={config} className="mx-auto h-44 w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="nom" />} />
            <Pie
              data={lignes}
              dataKey="nombre"
              nameKey="nom"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              strokeWidth={0}
            >
              {lignes.map((l, i) => (
                <Cell key={l.nom} fill={TEINTES[i % TEINTES.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Le total au centre du beignet, comme sur la maquette. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink tabular-nums">
            {total}
          </span>
          <span className="text-xs tracking-wide text-muted uppercase">
            Total
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {lignes.map((l, i) => (
          <li key={l.nom} className="flex items-center gap-2 text-sm">
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
