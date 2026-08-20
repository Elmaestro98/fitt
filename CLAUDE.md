# CLAUDE.md — Projet Fitt

Fichier de contexte pour toute session de travail sur Fitt.
À placer à la racine du dépôt (Claude Code) ou dans les connaissances d'un Projet Claude.

---

## 1. Le produit en 5 lignes

**Fitt** est un SaaS multi-tenant de gestion d'adhérents pour salles de sport, édité par AFRICATECHNOLOGIE (Saint-Louis / Dakar, Sénégal).
Chaque salle cliente est un **tenant** isolé. Le gérant et son équipe gèrent adhérents, abonnements, paiements et pointage depuis un back-office ; l'adhérent dispose d'un espace mobile léger.
Marché : salles indépendantes de 80 à 400 adhérents au Sénégal. Interface **en français**, devise **FCFA**, paiements **Wave / Orange Money / espèces**.
Marque : orange `#FF6B35`, navy `#0F172A`.

Le cahier des charges complet fait référence pour le fonctionnel. Ce fichier fait référence pour **la façon de coder**.

---

## 2. Stack imposée

| Couche | Choix | Non négociable |
|---|---|---|
| Framework | Next.js 15, App Router | oui |
| Langage | **TypeScript** | oui |
| Base de données | PostgreSQL via Supabase | oui |
| ORM | Prisma | oui |
| Auth staff | Clerk v7 + Organizations | oui |
| Auth adhérents | lien magique / OTP maison, **hors Clerk** | oui (voir §5) |
| Styles | Tailwind CSS | oui |
| Icônes | lucide-react | par défaut |
| Animations | Framer Motion | si besoin, avec parcimonie |
| Hébergement | Vercel | oui |
| Fichiers | Supabase Storage | oui |

Ne propose pas d'alternative à ces choix sauf si je pose explicitement la question.

---

## 3. Règle n°1 : l'isolation multi-tenant

C'est la règle qui prime sur toutes les autres. Une fuite de données entre deux salles clientes tue le produit.

**Obligations :**

- Toute table métier porte une colonne `gymId`. Sans exception.
- Toute requête Prisma filtre sur `gymId`. Sans exception.
- Le `gymId` est résolu **côté serveur** par `getTenantContext()`, à partir de la session Clerk. Il n'est **jamais** lu depuis un paramètre d'URL, un champ de formulaire, un header ou le body d'une requête.
- Aucun appel `prisma.*` direct dans un composant ou une route. Tout passe par la couche `lib/data/*` qui injecte le tenant.
- RLS activée sur toutes les tables comme filet de sécurité de dernier ressort — jamais comme mécanisme principal.

```ts
// lib/tenant.ts — le seul point d'entrée
export async function getTenantContext() {
  const { orgId, userId } = await auth();
  if (!orgId) throw new Error("Aucune salle active");
  const gym = await prisma.gym.findUnique({ where: { clerkOrgId: orgId } });
  if (!gym) throw new Error("Salle introuvable");
  return { gymId: gym.id, gym, userId };
}
```

```ts
// ✅ correct
const { gymId } = await getTenantContext();
return prisma.adherent.findMany({ where: { gymId, statut: "ACTIF" } });

// ❌ interdit
return prisma.adherent.findMany({ where: { statut: "ACTIF" } });
// ❌ interdit
return prisma.adherent.findMany({ where: { gymId: searchParams.gymId } });
```

Quand tu écris une nouvelle fonction d'accès aux données, **commence par le tenant**, pas par la logique métier.

---

## 4. Règle n°2 : l'adhérent appartient à sa salle

- **Aucune inscription publique d'adhérent.** Il n'existe pas de page « créer mon compte adhérent ».
- Un adhérent est créé par le staff, ou arrive via un lien d'invitation généré par la salle, et reste alors en `EN_ATTENTE_VALIDATION` jusqu'à validation par le staff.
- Un adhérent appartient à **une seule** salle. Pas de compte transversal.
- **Créer un adhérent ≠ l'inviter.** Le produit doit rester 100 % fonctionnel pour une salle dont aucun adhérent n'a activé son espace. Ne jamais écrire de logique qui suppose l'existence d'un compte adhérent.
- Jetons d'invitation : 32 octets aléatoires, stockés **hachés** (SHA-256), usage unique, expiration 7 jours par défaut, révocables.

---

## 5. Authentification : deux populations distinctes

| Population | Mécanisme | Raison |
|---|---|---|
| Staff (propriétaire, manager, réceptionniste, coach) | Clerk + Organizations | Faible volume, besoin de rôles et d'invitations |
| Adhérents | table `Adherent` + lien magique WhatsApp / OTP SMS, session 90 jours | Clerk facture au MAU : 6 000 adhérents = coût qui croît avec le succès. Et un adhérent ne retiendra pas un mot de passe |

Ne jamais créer d'utilisateur Clerk pour un adhérent, même « juste pour tester ».

---

## 6. Pièges connus — déjà rencontrés, ne pas les reproduire

**Supabase + Prisma**
```env
DATABASE_URL="postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@...supabase.com:5432/postgres"
```
Le pooler port **6543** avec `?pgbouncer=true` pour l'application, le port **5432** en `DIRECT_URL` pour les migrations. Sans ça : erreur en production sur Vercel.

**Prisma 7 : la CLI doit pointer sur DIRECT_URL, pas sur le pooler**
En Prisma 7 les URL vivent dans `prisma.config.ts`, plus dans `schema.prisma`.
Le bloc `datasource` de ce fichier ne sert **qu'à la CLI** (migrate, db pull,
studio) : y mettre `url: env("DIRECT_URL")`. Le pooler pgbouncer ne maintient
pas le verrou consultatif du moteur de migration → `prisma migrate` **se fige
indéfiniment, sans aucun message d'erreur**. Symptôme : la bannière affiche
`Datasource "db": ... at ...:6543` puis plus rien.
Diagnostic rapide :
```bash
node_modules/@prisma/engines/schema-engine-windows.exe --datasource '{"url":"<URL>"}' cli can-connect-to-database
```
L'application, elle, garde le pooler : `PrismaPg({ connectionString: process.env.DATABASE_URL })`.

**Ne jamais lancer Prisma avec `DEBUG=prisma*`**
Le mode debug écrit les URL de connexion **mot de passe en clair** dans la sortie. Si ça arrive : supprimer les logs et réinitialiser le mot de passe Supabase.

**Clerk v6 + Next.js 15**
En Next.js **15**, le middleware se nomme `src/middleware.ts`. Le renommage en
`proxy.ts` n'arrive qu'avec Next.js **16** (vérifié dans le source de 15.5.23 :
`MIDDLEWARE_LOCATION_REGEXP = (?:src/)?middleware`). Le jour du passage à Next 16 :
renommer le fichier **et** vérifier la compatibilité Clerk avant.

**Clerk v7 exige React ~19.1.4**
`create-next-app@15` installe React 19.1.0 → `ERESOLVE` à l'installation de Clerk.
Corriger en montant React (`react@19.1.9`), jamais avec `--force` ni `--legacy-peer-deps`.

**Prisma sur Vercel**
`prisma generate` dans le script `build`. Instance Prisma en singleton pour éviter l'épuisement du pool en dev.

**Le singleton Prisma survit au rechargement à chaud — y compris quand il ne devrait pas**
Après une migration, `prisma.<nouveauModele>` est `undefined` alors que TypeScript
compile sans erreur : l'instance rangée dans `globalThis` a été construite à partir
de l'ancien client généré et survit à tous les rechargements.
**Après tout `prisma migrate` ou `prisma generate` : redémarrer `npm run dev`.**
Le script `predev` regénère le client au démarrage, mais ne peut rien pour un
serveur déjà lancé.

**Migration SQL manuelle : attention à la shadow database**
Une migration écrite à la main (`prisma migrate dev --create-only`) est d'abord
rejouée sur une **base fantôme** vide, créée puis détruite à chaque migration.
Toute instruction qui suppose l'existence d'un objet créé *hors* des migrations
y échoue. Rencontré le 18/08/2026 : `ALTER TABLE "_prisma_migrations" ENABLE ROW
LEVEL SECURITY` → `42P01 relation does not exist`, alors que la table existe
évidemment en base réelle. L'échec a lieu sur la fantôme : la vraie base n'est
pas touchée, et `migrate resolve --rolled-back` répond alors `P3011`, ce qui est
normal — il n'y a rien à annuler.
Un fichier de migration **déjà appliqué ne doit plus être modifié** : Prisma en
vérifie l'empreinte et signalerait une dérive. Corriger dans une migration
suivante.

**Hydratation**
Tout store client (Zustand) lu au premier rendu provoque une erreur d'hydratation. Pattern : `useState(false)` + `useEffect(() => setMounted(true))`.

**TypeScript 6 incompatible avec Next.js 15**
`npm i -D typescript` installe la 6.x, qui rejette `import "./globals.css"` (erreur TS2882 : *Cannot find module or type declarations for side-effect import*). Next 15 ne déclare que `*.module.css`. Rester en `typescript@^5`.

**Supabase Storage — bucket et variables d'environnement**
Bucket `photos-adherents`, **public** (une photo de profil n'est pas une
donnée sensible ; sans bucket public, `next/image` ne peut pas l'afficher).
Deux variables, dans `.env` **et** `.env.local`, sans préfixe `NEXT_PUBLIC_`
(la clé `service_role` ne doit jamais atteindre le navigateur — tout
téléversement passe par une Server Action, jamais par un appel direct
client → Supabase) :
```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
`next.config.mjs` doit lister `*.supabase.co` dans `images.remotePatterns`,
sinon `next/image` refuse de charger l'URL publique renvoyée par Storage.

**Une transaction Prisma ne protège PAS un compteur contre la concurrence**
Sous l'isolation par défaut de Postgres (READ COMMITTED), deux transactions
peuvent lire la même valeur d'un compteur (`usages`, par ex.) avant que l'une
des deux n'ait validé son écriture — les deux passent alors la même
vérification. Rencontré le 19/08/2026 sur `inscrireViaLien` : un lien
"1 personne" pouvait créer deux fiches en cas de double-tap. Le correctif est
un verrou optimiste : `updateMany({ where: { id, usages: valeurLue },
data: { usages: { increment: 1 } } })`, puis vérifier `count === 1`. Déjà
appliqué correctement ailleurs (`ouvrirSessionDepuisInvitation`) — reprendre
ce pattern partout où un compteur ou un flag "usage unique" est incrémenté
dans une transaction.

**Un plafond de lot sur une file qui se rejoue en bloc peut la bloquer pour toujours**
`schemaLotPointages` plafonne un envoi à 200 passages : au-delà, Zod rejette
le tableau ENTIER, pas seulement l'excès. Sans découpage côté client, une
borne restée hors ligne assez longtemps pour dépasser 200 passages en file
ne se synchronise plus jamais, même au retour du réseau — chaque tentative
renvoie la même erreur sur la même file grandissante. Corrigé le 19/08/2026 :
`useFilePointage` découpe l'envoi en lots de 150. Le même risque existe pour
toute future file locale rejouée en bloc (mobile hors ligne, import...) :
toujours découper côté client sous la limite serveur, jamais l'inverse.

---

## 7. Conventions de code

**Structure**
```
src/
  app/
    (auth)/                 connexion staff
    (dashboard)/            back-office salle
      adherents/
      abonnements/
      paiements/
      pointage/
      cours/
      rapports/
      parametres/
    (adherent)/             espace adhérent mobile
    (public)/               landing, acceptation d'invitation
    api/
  components/
    ui/                     primitives réutilisables
    adherents/              composants métier par domaine
  lib/
    tenant.ts
    data/                   accès Prisma, un fichier par entité
    actions/                Server Actions, un fichier par domaine
    utils/                  formatage, validation
  hooks/
prisma/
  schema.prisma
```

**Règles**

- Server Components par défaut. `"use client"` seulement pour l'interactivité réelle.
- Mutations via **Server Actions**, jamais via des routes API sauf webhooks et intégrations externes.
- Validation systématique des entrées avec Zod, côté serveur, avant toute écriture.
- Aucun composant de plus de ~200 lignes : extraire en hooks (`useAdherents`, `usePaiement`, `usePointage`) et en sous-composants. C'est le pattern déjà appliqué sur SamaStock.
- Nommage : composants en `PascalCase`, fichiers utilitaires en `camelCase`, dossiers en `kebab-case`.
- Modèles et champs Prisma en **français** (`Adherent`, `Abonnement`, `dateFin`), variables techniques en anglais.
- Pagination et recherche **côté serveur** dès qu'une liste peut dépasser 50 lignes.
- États systématiquement traités : chargement (skeleton), vide (avec action), erreur (message actionnable).

---

## 8. Conventions métier

**Montants** — entiers en FCFA, jamais de décimales, jamais de flottants.
```ts
formatFCFA(15000) // "15 000 FCFA"  (espace insécable fine, pas de centimes)
```

**Téléphones** — format `+221 XX XXX XX XX`, stockés normalisés `+221XXXXXXXXX`. Unicité `(gymId, telephone)`.

**Dates** — stockage UTC, affichage en `Africa/Dakar`, format `JJ/MM/AAAA`.

**Statuts** — en base, en MAJUSCULES non traduites : `ACTIF`, `EXPIRE`, `SUSPENDU`, `EN_ATTENTE_VALIDATION`, `ARCHIVE`. La traduction française se fait à l'affichage.

**Numéro d'adhérent** — séquence **par salle**, format `FITT-0042`. Ne jamais réutiliser un numéro libéré.

**Textes d'interface** — français, tutoiement proscrit, vouvoiement neutre. Pas de jargon technique visible par le gérant.

---

## 9. Interdits absolus

| Interdit | Pourquoi |
|---|---|
| Supprimer physiquement un paiement | Traçabilité comptable. Annulation avec motif et écriture de contrepartie uniquement |
| Recalculer `dateFin` à partir de la formule à l'affichage | Un changement de tarif corromprait rétroactivement les abonnements en cours. `dateFin` est figée à la souscription |
| Supprimer une formule utilisée | Archiver seulement, sinon l'historique devient illisible |
| Bloquer le pointage en cas de coupure réseau | La salle doit rester ouverte. File locale + synchronisation au retour |
| Exposer `gymId` dans une URL ou un formulaire | Vecteur direct de fuite inter-tenant |
| Stocker un jeton d'invitation en clair | Une lecture de la base donnerait accès à tous les espaces |
| Créer un compte Clerk pour un adhérent | Coût MAU incontrôlable |
| Écrire de la logique de conseil santé / nutrition automatique | Fitt enregistre des mesures, il ne conseille pas. L'accompagnement relève du coach |

---

## 10. Modèle de données (résumé)

Toutes les tables métier portent `gymId`.

```
Gym · GymSettings
StaffMember · Adherent · AdherentDocument
Invitation · LienInscription
Formule · Abonnement · Paiement
Pointage
Coach · TypeCours · SessionCours · Reservation
Programme · Mesure
JournalMessage · JournalAudit
```

**Index critiques** : `(gymId, finLe)` sur `Abonnement` — requête la plus fréquente de l'app —, `(gymId, statut)` sur `Adherent`, `(gymId, horodatage)` sur `Pointage`, unique `(gymId, telephone)` sur `Adherent`.

---

## 11. Design system

Palette relevée au pixel sur `public/maquette.png` (tableau de bord) le 18/08/2026.
**La maquette fait référence**, pas les valeurs théoriques d'origine : la direction
retenue est un **gris neutre chaud**, pas un navy bleuté.

| Rôle | Valeur | Usage |
|---|---|---|
| Primaire | `#FF6B35` | boutons, liens d'action, icône active, accents |
| Fond sombre / sidebar | `#2D3133` | barre latérale |
| Nav active | `#363A3C` | ligne sélectionnée, + texte et barre orange |
| Fond de page | `#F7F9FB` | zone de contenu |
| Surface | `#FFFFFF` | cartes, tableaux, modales |
| Champ / surface enfoncée | `#F2F4F6` | recherche, inputs au repos |
| Succès | `#00AF79` | variations positives, statut ACTIF |
| Alerte | `#F59E0B` | échéance proche |
| Danger | `#BA1A1A` | expiration dépassée, impayé |
| Texte principal | `#191C1E` | titres, valeurs |
| Texte secondaire | `#6B7280` | labels, en-têtes de tableau, métadonnées |
| Bordures | `#E2E8F0` | séparateurs, contours de cartes |

Badges de formule (fond clair, texte foncé de la même famille) :
`Mensuel` `#DAE2FD` · `Annuel` `#E0E3E5` · une teinte par formule.

Rayons 12 px. Ombres très douces (la maquette privilégie la bordure fine à l'ombre
portée). Police Inter. Icônes en trait fin (lucide-react).

**Vocabulaire d'interface** — le menu de la maquette dit « Membres » et « Présences » :
utiliser **« Adhérents »** et **« Pointage »** (§7, §10). Le numéro visible reste
`FITT-0042` (§8), pas le `#MEM-4092` de la maquette.

**Mobile-first strict** : le back-office est utilisé sur téléphone à l'accueil. Cibles tactiles ≥ 44 px, utilisable à une main, testé à partir de 360 px de large.

---

## 12. Avancement

- [x] Cahier des charges v1.0
- [x] Maquettes Stitch : tableau de bord, liste adhérents, fiche adhérent, modale paiement, pointage kiosque, landing
- [ ] Maquettes : invitation d'adhérents, import CSV, formules, création adhérent
- [x] Lot 0 — socle technique, tenant, RLS, design system
- [x] Lot 1 — MVP vendable, **validé par un test bout en bout le 19/08/2026** (créer un adhérent → vendre un abonnement → encaisser → pointer) :
  - [x] Adhérents — liste paginée, fiche, création, modification, changement de statut
  - [x] Invitations (lien d'inscription + invitation nominative à l'espace adhérent)
  - [x] Formules — liste, création, modification, archivage
  - [x] Abonnements — souscription avec photographie figée du prix/durée (§9)
  - [x] Paiements — journal de caisse, filtres, statistiques, écriture de contrepartie
  - [x] Pointage — borne kiosque, code du jour, file locale résistante aux coupures réseau (§9)
  - [x] Tableau de bord, paramètres
- [~] Lot 2 — notifications WhatsApp, relances, import CSV, impayés :
  - [x] Import CSV — analyse/apercu puis confirmation, valide le 19/08/2026
  - [x] Relances impayés — bouton "Rappel WhatsApp" (lien wa.me, message pre-rempli) sur la liste des abonnements et sur la fiche adherent, des 7 jours avant echeance et sur les abonnements expires. Valide le 19/08/2026
  - [ ] Notifications WhatsApp automatiques — **en pause le 19/08/2026** : verification Meta Business, templates approuves, webhook et cout par message sont un chantier lourd pour un gain marginal face au bouton "Rappel WhatsApp" deja en place. A reprendre si une salle cliente le demande explicitement.
- [x] Lot 3 — espace adhérent : code-complet et **validé par test le 19/08/2026** (activation par lien, connexion, accueil, séances, abonnements, profil, pointage) — construit en avance sur le Lot 2
- [ ] Lot 4 — cours et coachs
- [~] Lot 5 — rapports et back-office Super Admin :
  - [x] Rapports (`/rapports`) — encaissements reels par mois, repartition par methode de paiement, taux de renouvellement (delai de grace 14 j), top adherents assidus, filtre de periode (3/6/12/24 mois) et export CSV (`/api/rapports/export`, premiere route API du projet — GET, hors Server Actions car un telechargement a besoin d'un en-tete Content-Disposition). Valide le 19/08/2026
  - [ ] Back-office Super Admin (vue AFRICATECHNOLOGIE sur l'ensemble des salles clientes) — non commence
- [ ] Lot 6 — paiements en ligne Wave / Orange Money

Le **Lot 1 est le seuil de commercialisation** : une salle doit pouvoir abandonner son carnet à la fin de ce lot. Le code y est, mais aucun parcours n'a encore été rejoué de bout en bout dans le navigateur — c'est la prochaine étape avant de considérer le seuil franchi.

---

## 13. Comment je veux que tu travailles

- Réponds en **français**.
- Va droit au code. Pas de préambule, pas de récapitulatif de ce que je viens de demander.
- Code complet et fonctionnel, pas de `// TODO` ni de fonction laissée vide.
- Si une décision d'architecture a plusieurs options défendables, dis-le en deux lignes et tranche avec une recommandation. Ne me laisse pas arbitrer un choix technique que tu peux arbitrer.
- Si je te demande quelque chose qui viole une règle des §3, §4 ou §9, signale-le avant de coder.
- Quand tu proposes un schéma Prisma ou une migration, vérifie d'abord la cohérence avec les tables existantes.
