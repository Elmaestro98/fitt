// =============================================================================
// La periode d'observation du tableau de bord.
//
// Fonction PURE, volontairement seule de son espece : elle ne lit ni session,
// ni base, ni URL — on lui donne les chaines de caracteres venues du
// navigateur, elle rend une periode bornee et sure. Ecrite une deuxieme fois
// ailleurs, elle finirait par diverger, et deux cartes du meme ecran
// couvriraient des jours differents sans que personne ne le voie.
//
// Tout est calcule en UTC, ce qui correspond exactement a l'heure de Dakar
// (UTC+0 toute l'annee, sans heure d'ete) : une journee va bien de minuit a
// minuit, heure locale (§8).
// =============================================================================

/** Preselections offertes par le filtre, dans l'ordre d'affichage. */
export const PERIODES = ["7j", "30j", "mois", "3m", "12m"] as const;

export type PeriodePredefinie = (typeof PERIODES)[number];
export type ClePeriode = PeriodePredefinie | "perso";

export type Periode = {
  cle: ClePeriode;
  /** Premier instant compris dans la periode. */
  debut: Date;
  /**
   * Borne de fin EXCLUSIVE : minuit du lendemain du dernier jour compte.
   * Une comparaison `< fin` attrape ainsi tout le dernier jour, y compris un
   * pointage a 23 h 58. Avec une borne inclusive posee a minuit, cette
   * journee entiere disparaitrait des totaux.
   */
  fin: Date;
  /**
   * Dernier jour reellement COMPRIS dans la periode.
   *
   * Double emploi de `fin`, et c'est voulu : `fin` est la borne exclusive que
   * consomment les requetes, `dernierJour` est la date que voit l'utilisateur
   * dans un champ ou dans un libelle. Melanger les deux, c'est afficher au
   * gerant un jour de plus que ce qui est compte.
   */
  dernierJour: Date;
  /** La periode de meme ampleur qui precede, pour la variation en %. */
  debutPrecedent: Date;
  finPrecedent: Date;
  /** "Les 30 derniers jours" — pour le sous-titre de la page. */
  libelle: string;
  /** "30 jours precedents" — ce a quoi la variation en % se compare. */
  libelleComparaison: string;
  /** "30 j" — pour l'etiquette d'une carte, ou la place manque. */
  libelleCourt: string;
  /** Nombre de journees entieres couvertes. */
  jours: number;
  /**
   * Pas de temps des graphes. Une periode de trois mois decoupee en jours
   * donnerait quatre-vingt-dix barres illisibles sur un telephone ; un mois
   * decoupe en mois n'en donnerait qu'une seule.
   */
  granularite: "jour" | "mois";
};

const JOUR = 86_400_000;

/** Minuit UTC du jour de `date`, decale de `decalageJours`. */
function minuit(date: Date, decalageJours = 0): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + decalageJours,
    ),
  );
}

/** Premier jour du mois de `date`, decale de `decalageMois`. */
function premierDuMois(date: Date, decalageMois = 0): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + decalageMois, 1),
  );
}

function nombreDeJours(debut: Date, fin: Date): number {
  return Math.max(1, Math.round((fin.getTime() - debut.getTime()) / JOUR));
}

function granularitePour(jours: number): "jour" | "mois" {
  return jours <= 31 ? "jour" : "mois";
}

/**
 * "20 juil." — ou "20 juil. 2024" des que la date sort de l'annee en cours.
 * Sans ce rappel, une plage remontant a deux ans s'annoncerait "Du 31 aout au
 * 1 sept." et se confondrait avec la semaine derniere.
 */
function formatCourt(date: Date, annee: boolean): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    ...(annee ? { year: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(date);
}

/**
 * "2026-09-02" -> minuit UTC ce jour-la. Renvoie null sur toute saisie qui
 * n'est pas exactement une date du calendrier : la chaine vient de l'URL,
 * donc de l'utilisateur, donc on ne lui fait aucune confiance.
 *
 * Le controle `getUTCDate() === jour` n'est pas superflu : Date.UTC accepte
 * le 31 fevrier et le fait glisser au 3 mars sans rien signaler.
 */
export function analyserDateISO(valeur: string | undefined): Date | null {
  if (!valeur || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return null;

  const [annee, mois, jour] = valeur.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));

  if (
    date.getUTCFullYear() !== annee ||
    date.getUTCMonth() !== mois - 1 ||
    date.getUTCDate() !== jour
  ) {
    return null;
  }
  return date;
}

/** L'inverse : une Date -> "2026-09-02", ce qu'attend un <input type="date">. */
export function versDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Le plus ancien jour interrogeable. Trois ans couvrent tres largement les
 * besoins d'une salle, et cette borne empeche une URL bricolee de demander
 * une agregation sur mille ans de pointages.
 */
const RECUL_MAXIMUM_JOURS = 366 * 3;

/**
 * Le point d'entree. `periode`, `du` et `au` arrivent tels quels de l'URL.
 *
 * Aucune saisie n'est jamais transmise a Prisma : soit elle correspond a une
 * cle de la liste blanche, soit elle est reanalysee en date valide, soit on
 * retombe silencieusement sur le mois en cours. Meme principe que la
 * validation de `vue` sur la liste des abonnements.
 *
 * Defaut : le mois en cours — les chiffres affiches a l'ouverture de Fitt
 * restent ceux que le gerant connait deja.
 */
export function resoudrePeriode(
  { periode, du, au }: { periode?: string; du?: string; au?: string },
  maintenant: Date = new Date(),
): Periode {
  const demain = minuit(maintenant, 1);

  // --- Plage libre ---------------------------------------------------------
  const debutSaisi = analyserDateISO(du);
  const finSaisie = analyserDateISO(au);

  if (debutSaisi && finSaisie) {
    // Deux dates a l'envers ne sont pas une erreur a signaler : l'intention
    // est evidente, on remet simplement la plus ancienne devant.
    const [d, f] =
      debutSaisi <= finSaisie
        ? [debutSaisi, finSaisie]
        : [finSaisie, debutSaisi];

    const planche = minuit(maintenant, -RECUL_MAXIMUM_JOURS);
    const debut = d < planche ? planche : d;

    // `fin` est exclusive : le jour saisi dans "au" doit etre compte en
    // entier, donc on borne au lendemain. Jamais au-dela de demain — une
    // periode qui deborde sur le futur n'ajouterait que du vide.
    const fin = new Date(
      Math.min(minuit(f, 1).getTime(), demain.getTime()),
    );
    const finUtile = fin > debut ? fin : minuit(debut, 1);

    const jours = nombreDeJours(debut, finUtile);
    const duree = finUtile.getTime() - debut.getTime();
    const dernierJour = minuit(finUtile, -1);

    // L'annee n'est rappelee que si la plage sort de l'annee en cours : la
    // porter systematiquement alourdirait le cas courant, qui est de loin le
    // plus frequent.
    const anneeCourante = maintenant.getUTCFullYear();
    const afficherAnnee =
      debut.getUTCFullYear() !== anneeCourante ||
      dernierJour.getUTCFullYear() !== anneeCourante;

    return {
      cle: "perso",
      debut,
      fin: finUtile,
      dernierJour,
      debutPrecedent: new Date(debut.getTime() - duree),
      finPrecedent: debut,
      libelle: `Du ${formatCourt(debut, afficherAnnee)} au ${formatCourt(dernierJour, afficherAnnee)}`,
      libelleComparaison: `${jours} jour${jours > 1 ? "s" : ""} precedent${jours > 1 ? "s" : ""}`,
      libelleCourt: `${jours} j`,
      jours,
      granularite: granularitePour(jours),
    };
  }

  // --- Preselections -------------------------------------------------------
  const cle: PeriodePredefinie = (PERIODES as readonly string[]).includes(
    periode ?? "",
  )
    ? (periode as PeriodePredefinie)
    : "mois";

  if (cle === "mois") {
    const debut = premierDuMois(maintenant);
    const jours = nombreDeJours(debut, demain);

    // /!\ La comparaison se fait A DATE EGALE dans le mois precedent, pas
    // contre le mois precedent COMPLET. Le 2 du mois, deux jours de ventes
    // opposes a trente-et-un afficheraient -94 % : une alarme fausse, chaque
    // debut de mois, que le gerant apprendrait a ignorer — et il ignorerait
    // aussi la vraie le jour ou elle arriverait.
    const debutPrecedent = premierDuMois(maintenant, -1);
    const finPrecedent = new Date(
      Math.min(
        debutPrecedent.getTime() + (demain.getTime() - debut.getTime()),
        debut.getTime(),
      ),
    );

    return {
      cle,
      debut,
      fin: demain,
      dernierJour: minuit(maintenant),
      debutPrecedent,
      finPrecedent,
      libelle: `Depuis le 1er ${new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        timeZone: "UTC",
      }).format(debut)}`,
      // "a la meme date" et non "mois dernier" tout court : c'est bien le
      // 1er-au-2 aout qui sert de reference le 2 septembre, pas aout entier.
      libelleComparaison: "le mois dernier a la meme date",
      libelleCourt: "Ce mois",
      jours,
      granularite: granularitePour(jours),
    };
  }

  if (cle === "3m" || cle === "12m") {
    // Des mois CALENDAIRES, et non 90 ou 365 jours glissants. Ces deux
    // periodes ont leurs graphes groupes par mois : en glissant, la premiere
    // colonne ne couvrirait qu'une partie de son mois et se lirait comme un
    // effondrement des ventes, alors qu'il n'en est rien.
    const nombreDeMois = cle === "3m" ? 3 : 12;
    const debut = premierDuMois(maintenant, -(nombreDeMois - 1));

    return {
      cle,
      debut,
      fin: demain,
      dernierJour: minuit(maintenant),
      debutPrecedent: premierDuMois(maintenant, -(nombreDeMois * 2 - 1)),
      finPrecedent: debut,
      libelle: `Les ${nombreDeMois} derniers mois`,
      libelleComparaison: `${nombreDeMois} mois precedents`,
      libelleCourt: `${nombreDeMois} mois`,
      jours: nombreDeJours(debut, demain),
      granularite: "mois",
    };
  }

  // 7j / 30j : periodes glissantes, aujourd'hui inclus.
  const nombre = Number(cle.replace("j", ""));
  const debut = minuit(maintenant, -(nombre - 1));

  return {
    cle,
    debut,
    fin: demain,
    dernierJour: minuit(maintenant),
    debutPrecedent: minuit(maintenant, -(nombre * 2 - 1)),
    finPrecedent: debut,
    libelle: `Les ${nombre} derniers jours`,
    libelleComparaison: `${nombre} jours precedents`,
    libelleCourt: `${nombre} j`,
    jours: nombre,
    granularite: granularitePour(nombre),
  };
}

/**
 * La liste des colonnes d'un graphe, y compris celles restees vides.
 *
 * Reconstruire les creux est indispensable : un trou dans un graphe se lit
 * comme une donnee manquante, pas comme un zero. La convention existait deja
 * dans evolutionSouscriptions et frequentationHebdomadaire, elle est
 * simplement remontee ici pour ne plus etre ecrite deux fois.
 *
 * La `cle` est le prefixe ISO produit par `date_trunc` cote PostgreSQL :
 * "2026-09-02" au jour, "2026-09" au mois. C'est elle qui raccorde une ligne
 * de la base a sa colonne.
 */
export function colonnesDe(
  periode: Periode,
): { cle: string; libelle: string }[] {
  const colonnes: { cle: string; libelle: string }[] = [];

  if (periode.granularite === "mois") {
    const curseur = premierDuMois(periode.debut);
    while (curseur < periode.fin) {
      colonnes.push({
        cle: versDateISO(curseur).slice(0, 7),
        libelle: new Intl.DateTimeFormat("fr-FR", {
          month: "short",
          timeZone: "UTC",
        }).format(curseur),
      });
      curseur.setUTCMonth(curseur.getUTCMonth() + 1);
    }
    return colonnes;
  }

  // Au jour : colonnes nommees par jour de la semaine sur une semaine ou
  // moins ("lun", "mar"), par la date au-dela — quatre "lun" dans un graphe
  // d'un mois ne situeraient plus rien.
  const parJourDeSemaine = periode.jours <= 8;
  const format = new Intl.DateTimeFormat(
    "fr-FR",
    parJourDeSemaine
      ? { weekday: "short", timeZone: "UTC" }
      : { day: "numeric", month: "short", timeZone: "UTC" },
  );

  const curseur = new Date(periode.debut);
  while (curseur < periode.fin) {
    colonnes.push({
      cle: versDateISO(curseur),
      libelle: format.format(curseur),
    });
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }
  return colonnes;
}
