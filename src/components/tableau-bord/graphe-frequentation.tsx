"use client";

// Composant client : Recharts mesure le conteneur et dessine dans le
// navigateur. Les DONNEES arrivent deja agregees du serveur — aucune requete
// depuis le navigateur.
//
// Des barres et non une courbe : la frequentation est une suite de journees
// distinctes, pas une grandeur continue. Relier lundi a mardi par une pente
// suggererait un passage a 14 h 30 le lundi soir.
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shadcn/chart";

const config = {
  passages: { label: "Passages", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function GrapheFrequentation({
  donnees,
}: {
  donnees: { libelle: string; passages: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-44 w-full">
      <BarChart data={donnees} margin={{ left: 4, right: 8, top: 8 }}>
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
          width={32}
          // Des passages sont des entiers : pas de graduation a 2,5.
          allowDecimals={false}
          className="text-xs"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(valeur) =>
                `${valeur} passage${Number(valeur) > 1 ? "s" : ""}`
              }
            />
          }
        />
        <Bar
          dataKey="passages"
          fill="var(--color-chart-1)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
