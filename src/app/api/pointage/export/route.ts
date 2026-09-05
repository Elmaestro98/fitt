// Export CSV du registre de presence.
//
// Deuxieme route API du projet, pour la meme raison que la premiere
// (/api/rapports/export) : ce n'est pas une mutation mais un telechargement,
// qui a besoin d'un en-tete Content-Disposition qu'une Server Action ne peut
// pas poser (§7). Le middleware protege deja /api/* : cette route exige une
// session staff valide comme n'importe quelle page du back-office.
import { NextRequest } from "next/server";
import {
  lignesExportRegistre,
  SOURCES,
  type SourceRegistre,
} from "@/lib/data/pointage";
import { formatDate, formatHeure } from "@/lib/utils/format";

const LIBELLES_SOURCE: Record<string, string> = {
  KIOSQUE: "Borne",
  STAFF: "Reception",
  ADHERENT: "Espace adherent",
};

const LIBELLES_STATUT: Record<string, string> = {
  ACTIF: "Actif",
  EXPIRE: "Expire",
  SUSPENDU: "Suspendu",
  EN_ATTENTE_VALIDATION: "En attente de validation",
  ARCHIVE: "Archive",
};

/** Neutralise le separateur a l'interieur d'une valeur. Un nom compose
 *  contenant un point-virgule decalerait toutes les colonnes suivantes. */
function champ(valeur: string): string {
  return /[";\n]/.test(valeur) ? `"${valeur.replace(/"/g, '""')}"` : valeur;
}

function dateISO(valeur: string | null): string | undefined {
  return valeur && /^\d{4}-\d{2}-\d{2}$/.test(valeur) ? valeur : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Les parametres viennent de l'URL : aucune confiance. Une source hors
  // liste blanche ou une date malformee est ignoree, jamais transmise telle
  // quelle a la couche de donnees.
  const sourceBrute = params.get("source") ?? "";
  const source = SOURCES.includes(sourceBrute as SourceRegistre)
    ? (sourceBrute as SourceRegistre)
    : undefined;

  // lignesExportRegistre() resout le gymId depuis la session : aucun
  // identifiant de salle ne transite par cette URL (§9).
  const du = dateISO(params.get("du"));
  const au = dateISO(params.get("au"));

  const passages = await lignesExportRegistre({
    recherche: params.get("recherche") ?? undefined,
    du,
    au,
    source,
  });

  const entetes = [
    "Date",
    "Heure",
    "Numero",
    "Prenom",
    "Nom",
    "Telephone",
    "Statut au passage",
    "Enregistre par",
  ].join(";");

  const corps = passages
    .map((p) =>
      [
        formatDate(p.horodatage),
        formatHeure(p.horodatage),
        champ(p.adherent.numero),
        champ(p.adherent.prenom),
        champ(p.adherent.nom),
        champ(p.adherent.telephone),
        LIBELLES_STATUT[p.statutAdherent] ?? p.statutAdherent,
        LIBELLES_SOURCE[p.source] ?? p.source,
      ].join(";"),
    )
    .join("\n");

  // Le BOM UTF-8 en tete fait qu'Excel affiche correctement les accents —
  // sans lui, un tableur ouvert par defaut en Windows-1252 rend un charabia.
  const csv = `﻿${entetes}\n${corps}\n`;

  // Le nom du fichier porte la periode : trois exports successifs ne
  // s'ecrasent pas dans le dossier Telechargements.
  //
  // /!\ Il est bati sur les dates VALIDEES, jamais sur les parametres bruts.
  // Une valeur inventee contenant un guillemet ou un retour a la ligne
  // s'echapperait sinon de l'en-tete Content-Disposition — une injection
  // d'en-tete HTTP, a partir d'une simple barre d'adresse.
  const suffixe = [du, au].filter(Boolean).join("_");
  const nom = suffixe ? `fitt-presences-${suffixe}.csv` : "fitt-presences.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nom}"`,
    },
  });
}
