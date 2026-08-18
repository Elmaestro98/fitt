"use client";

// Composant client : Recharts mesure le conteneur et dessine dans le
// navigateur. Les DONNEES, elles, sont calculees cote serveur et arrivent
// deja agregees — aucune requete depuis le navigateur.
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shadcn/chart";

const config = {
  montant: { label: "Souscrit", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

/** 250 000 -> "250 k" — un axe lisible sur telephone. */
function abrege(valeur: number) {
  if (valeur >= 1_000_000) return `${Math.round(valeur / 100_000) / 10} M`;
  if (valeur >= 1_000) return `${Math.round(valeur / 1_000)} k`;
  return String(valeur);
}

export function GrapheSouscriptions({
  donnees,
}: {
  donnees: { libelle: string; montant: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={donnees} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="degradeSouscrit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis
          dataKey="libelle"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={abrege}
          className="text-xs"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(valeur) =>
                `${Number(valeur).toLocaleString("fr-FR")} FCFA`
              }
            />
          }
        />
        <Area
          dataKey="montant"
          type="monotone"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          fill="url(#degradeSouscrit)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
