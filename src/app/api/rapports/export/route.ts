// Export CSV des rapports.
//
// Seule exception du projet aux Server Actions (CLAUDE.md §7) : ce n'est pas
// une mutation, c'est un telechargement, qui a besoin d'un en-tete
// Content-Disposition qu'une Server Action ne peut pas poser. Le middleware
// protege deja /api/* (src/middleware.ts) : cette route exige une session
// valide comme n'importe quelle page du back-office.
import { NextRequest } from "next/server";
import {
  lignesExportRapport,
  PERIODES_RAPPORT,
  type PeriodeRapport,
} from "@/lib/data/rapport";

function estPeriodeValide(v: number): v is PeriodeRapport {
  return (PERIODES_RAPPORT as readonly number[]).includes(v);
}

export async function GET(request: NextRequest) {
  // Le parametre vient de l'URL : on ne lui fait aucune confiance. Une valeur
  // hors liste blanche retombe sur 12, elle n'est jamais transmise telle
  // quelle a la couche de donnees.
  const moisBrut = Number(request.nextUrl.searchParams.get("mois"));
  const mois = estPeriodeValide(moisBrut) ? moisBrut : 12;

  // lignesExportRapport() resout le gymId depuis la session (getTenantContext) :
  // aucun identifiant de salle ne transite par cette URL (§9).
  const lignes = await lignesExportRapport(mois);

  const entetes = [
    "Mois",
    "Especes (FCFA)",
    "Wave (FCFA)",
    "Orange Money (FCFA)",
    "Total (FCFA)",
  ].join(";");

  const corps = lignes
    .map((l) =>
      [l.libelle, l.especes, l.wave, l.orangeMoney, l.total].join(";"),
    )
    .join("\n");

  // Le BOM UTF-8 en tete fait qu'Excel affiche correctement les accents —
  // sans lui, "Août" devient un charabia dans un tableur ouvert par defaut
  // en Windows-1252.
  const csv = `﻿${entetes}\n${corps}\n`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fitt-rapport-${mois}mois.csv"`,
    },
  });
}
