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

**Supabase Storage — buckets et variables d'environnement**
Deux buckets, **publics** tous les deux (ni une photo de profil ni une photo
de produit n'est une donnée sensible ; sans bucket public, `next/image` ne
peut pas les afficher) : `photos-adherents` et `photos-produits`.
Un bucket par nature de contenu, `lib/data/stockage.ts` expose une fonction
par usage au-dessus d'une validation commune (format, 5 Mo, nom de fichier
aléatoire).
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

**`@supabase/supabase-js` ne démarre pas dans un script Node 20 autonome**
Le client instancie un `RealtimeClient` qui exige un WebSocket natif, absent
de Node 20 (`Error: Node.js 20 detected without native WebSocket support`).
L'application n'est pas concernée : Next.js en fournit un. Pour un script
jetable d'administration du Storage, appeler l'API REST directement
(`GET`/`POST {SUPABASE_URL}/storage/v1/bucket`, en-têtes `apikey` et
`Authorization: Bearer`) plutôt que d'installer `ws`.

**Un champ absent d'un `update` Prisma n'est pas un champ mis à `null`**
Et c'est exactement ce qu'il faut exploiter pour un fichier facultatif. À la
modification d'un produit, « ne pas envoyer de photo » veut dire *ne pas y
toucher*, pas *l'effacer* : sans cette distinction, chaque changement de prix
supprimerait l'image. D'où le type `IntentionPhoto` à trois états explicites
(`inchangee` / `remplacee` / `retiree`) dans `lib/data/produit.ts`, et la case
« Retirer la photo » côté formulaire — sans elle, une photo posée par erreur
ne pourrait plus jamais être enlevée.

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

**Un `contains: ""` dans un `OR` Prisma annule silencieusement tout le filtre**
`listerAdherents` construisait son critère téléphone avec
`termes.replace(/\D/g, "")` : sur une recherche sans aucun chiffre ("Moussa"),
ça donne `contains: ""`. Une chaîne vide est contenue dans n'importe quel
texte, donc cette branche du `OR` est toujours vraie — elle annule les autres
critères (nom, prénom, numéro) et la recherche renvoie tous les adhérents de
la salle au lieu de filtrer. Trouvé le 20/08/2026 en testant la réservation
de séances (Lot 4), qui réutilise `listerAdherents`. Corrigé : la clause
téléphone n'est ajoutée au `OR` que si la chaîne de chiffres est non vide.
Même risque partout où un `contains`/`in` est construit à partir d'une valeur
dérivée (regex, slice...) plutôt que de la saisie brute : vérifier qu'une
transformation ne peut pas produire une chaîne vide qui rendrait la condition
toujours vraie.

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
| Supprimer un produit vendu, ou lire son prix depuis `Produit` à l'affichage d'une commande | Même raison qu'une formule : `LigneCommande` fige `nomProduit` et `prixUnitaire` à la commande |
| Faire confiance à un prix envoyé par le navigateur | Le panier de l'espace adhérent n'envoie que des identifiants et des quantités. Les tarifs sont relus en base avant écriture |
| Bloquer le pointage en cas de coupure réseau | La salle doit rester ouverte. File locale + synchronisation au retour |
| Faire dépendre un abonnement, un paiement ou un statut d'adhérent d'un **pointage** | L'adhérent paie un droit d'accès, pas une consommation : son absence ne raccourcit jamais son contrat. Le pointage **lit** l'abonnement ; l'abonnement n'entend jamais parler du pointage. Une absence prolongée se signale (cloche, décrochage), elle ne se sanctionne pas automatiquement |
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
Produit · Commande · LigneCommande
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
portée). Icônes en trait fin (lucide-react).

**Typographie — deux familles, deux rôles** (révisé le 22/08/2026, remplace
« Police Inter » seule) :

| Famille | Classe | Emploi |
|---|---|---|
| **Space Grotesk** | `display` | Titres de page, valeurs d'indicateur, montants, libellés de boutons, en-têtes de tableau, entrée de menu active |
| **Inter** | par défaut | Corps de texte, cellules de tableau, formulaires, aides et messages |

La règle : **on habille les titres, on ne complique jamais la lecture des
données.** Un gérant lit un tableau de quarante lignes à l'accueil, en plein
jour, sur un téléphone — une police de caractère sur du texte long est de la
fatigue oculaire gratuite. Space Grotesk ne descend jamais dans un paragraphe.

`.display` ne déclare **que** la famille, jamais d'interlettrage : les règles de
`globals.css` vivent hors des couches Tailwind et écraseraient silencieusement
un `tracking-wide`. Le resserrement se demande à la main (`tracking-tight`).

Chiffres à chasse fixe (`tabular-nums`) appliqués d'office à tout `<table>` :
sans cela une colonne de montants FCFA danse d'une ligne à l'autre et l'œil ne
peut plus comparer deux totaux.

**Mouvement** — jetons dans `globals.css`, catalogue vivant sur `/design-system`.

Principe : *le mouvement sert à expliquer, jamais à décorer.* Une carte qui monte
de 8 px dit « je viens d'arriver » ; un bouton qui s'enfonce dit « j'ai reçu ton
appui » — ce qui compte double à l'accueil, sur une connexion lente, quand la
seule preuve que le clic est parti est cette animation.

| Jeton / classe | Emploi |
|---|---|
| `--ease-sortie` | Courbe par défaut de tout le produit |
| `--ease-ressort` | Ce qui **apparaît** (modale, pastille). Jamais ce qui disparaît |
| `--duree-instant/courte/moyenne/longue` | 120 / 200 / 320 / 480 ms |
| `animate-apparition` `animate-surgir` `animate-remonter` `animate-voile` | Entrées |
| `.cascade` | Enfants directs décalés de 45 ms, plafonné à 8 |
| `.carte-interactive` | Se soulève au survol — **uniquement si réellement cliquable** |
| `.enfoncable` | S'enfonce à l'appui (seul retour tactile au doigt) |
| `.squelette` | Chargement : la forme de ce qui arrive, jamais un rond qui tourne |
| `shadow-souleve` `shadow-flottant` `shadow-lueur` | Relief **en mouvement** seulement ; une carte au repos reste plate |

Deux interdits :
- **Aucun mouvement sur un élément non interactif.** Ce qui bouge sous le
  curseur promet une action ; s'il n'y en a pas, l'utilisateur clique dans le
  vide et croit à un bug.
- **`prefers-reduced-motion` n'est pas optionnel.** Le trouble vestibulaire est
  réel. La règle globale de `globals.css` coupe tout **en laissant tout visible**
  — une animation coupée sans état final laisserait la page blanche.

Framer Motion reste inutilisé : tout ceci est du CSS, donc aucun `"use client"`
imposé à un Server Component et aucun kilo-octet de JavaScript envoyé.

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
- [x] Lot 4 — cours et coachs : code-complet et **validé par test le 20/08/2026** (coachs, types de cours, planning, réservation avec verrou de capacité optimiste, annulation de séance, modification de séance) :
  - [x] Coachs — fiche simple (pas de compte Clerk), liste, création, modification, archivage
  - [x] Types de cours — catalogue (nom, couleur, durée/capacité par défaut), liste, création, modification, archivage
  - [x] Séances — planning groupé par jour, création, modification (capacité bornée par les places déjà réservées), annulation avec motif (§9, jamais de suppression)
  - [x] Réservations — inscription/désinscription d'un adhérent depuis la fiche de la séance, verrou optimiste sur `placesReservees` (même pattern que `LienInscription.usages`, §6), réinscription après désinscription (upsert sur la ligne existante plutôt que doublon)
  - Décisions du 20/08/2026 : pas de compte coach, séances créées une par une (pas de récurrence), réservation faite par le staff uniquement (pas de self-service adhérent) — à reprendre plus tard si besoin
- [~] Lot 5 — rapports et back-office Super Admin :
  - [x] Rapports (`/rapports`) — encaissements reels par mois, repartition par methode de paiement, taux de renouvellement (delai de grace 14 j), top adherents assidus, filtre de periode (3/6/12/24 mois) et export CSV (`/api/rapports/export`, premiere route API du projet — GET, hors Server Actions car un telechargement a besoin d'un en-tete Content-Disposition). Valide le 19/08/2026
  - [x] Back-office Super Admin (`/admin`) — vue AFRICATECHNOLOGIE sur l'ensemble des salles clientes. Valide le 21/08/2026 :
    - Acces reserve par `getSuperAdminContext()`, qui lit `publicMetadata.superAdmin` sur le compte Clerk — **pas** une organisation (piste abandonnee, voir §6)
    - Les seules requetes Prisma du projet sans filtre `gymId`, par nature et de facon commentee
    - Une salle nouvellement creee arrive **sans acces** (`actif: false`) : le Super Admin l'active, par la fiche ou par l'e-mail de son gerant
    - Trois etats distincts grace a `Gym.activeeLe` : active / en attente (jamais activee) / suspendue (activee puis coupee)
    - Fiche detaillee par salle (adherents, abonnements actifs, staff Clerk), tri des colonnes, vue financiere agregee avec filtre par mois
    - Identite visuelle volontairement distincte (console sombre, JetBrains Mono), avec bascule clair/sombre — jetons `--color-admin-*` dans globals.css, sans toucher au reste du produit qui reste clair
- [x] Boutique — hors feuille de route d'origine, ajoutee le 21/08/2026 et validee de bout en bout le meme jour (catalogue staff -> commande adherent -> preparation -> remise -> encaissement -> journal de caisse) :
  - [x] `Produit` — catalogue par salle (`/boutique`), archivage jamais suppression (§9)
  - [x] `Commande` / `LigneCommande` — `EN_ATTENTE` -> `PRETE` -> `RECUPEREE`, ou `ANNULEE` avec motif. `nomProduit` et `prixUnitaire` figes a la commande, comme `Abonnement.prixPaye`
  - [x] Espace adherent (`/espace/boutique`, `/espace/commandes`) — panier en memoire du navigateur seulement, auto-annulation tant que la salle n'a rien prepare
  - [x] Back-office (`/commandes`) — file a traiter avec compteur, historique, remise + encaissement
  - **Paiement sur place a la recuperation** (decision du 21/08/2026), pas en ligne : la remise ecrit dans le journal de caisse existant (`Paiement.commandeId`), donc ces ventes remontent seules dans `/rapports` et dans la vue financiere Super Admin. Le paiement en ligne reste le Lot 6
- [x] Retention — hors feuille de route, ajoutee et validee le 21/08/2026 :
  - [x] Recherche globale de la barre haute (nom, prenom, numero, telephone), navigation clavier et Ctrl+K. Le critere de recherche est partage avec `listerAdherents` : le piege du `contains: ""` (§6) n'est ecrit qu'a un seul endroit
  - [x] Centre d'alertes de la cloche — inscriptions a valider, echeances sous 7 jours, commandes a preparer, adherents qui decrochent. **Sans rapport avec les notifications WhatsApp en pause** : WhatsApp est un canal d'ENVOI, ceci lit des donnees deja en base
  - [x] **Detection du decrochage** (`lib/data/decrochage.ts`) — l'angle mort du produit : Fitt surveillait le CONTRAT (quand l'abonnement expire-t-il ?) mais pas le COMPORTEMENT (vient-il encore ?). Un adherent qui a paye un annuel reste `ACTIF` un an, meme s'il a cesse de venir au deuxieme mois, et rien ne le signalait avant le renouvellement — trop tard pour le retenir. Croisement abonnement ACTIF + dernier `Pointage` de plus de 21 jours. Trois subtilites : les jamais-venus sont rattrapes en prenant `debutLe` comme date de reference (un calcul cherchant une date de passage inexistante les raterait), ce meme repli donne gratuitement le delai de grace des nouveaux inscrits, et les abonnements expires sont exclus car ils relevent deja de la relance impayes. `cache()` de React sur la fonction : le tableau de bord affiche la liste et la cloche la compte dans le meme rendu, sans double requete ni risque que les deux chiffres divergent
- [x] Registre de présence (`/pointage/registre`) — ajouté le 05/09/2026, l'angle mort du module de pointage : la borne montrait les 12 derniers passages, la fiche d'un adhérent les 20 siens, mais « qui est venu le 3 septembre ? » n'avait aucune réponse et rien n'était exportable :
  - Filtres par dates exactes (`du`/`au`, bornes **comprises**, la borne envoyée à Prisma est le lendemain en `lt`), raccourcis 7/30 jours, source (borne / réception / espace adhérent) et recherche d'adhérent. Tous les critères vivent dans l'URL : une vue devient un favori
  - Le critère de recherche est **importé** de `lib/data/adherent.ts` (`critereRechercheAdherent`, désormais exporté), jamais recopié — le piège du `contains: ""` (§6) reste écrit à un seul endroit
  - Compteurs de **la sélection** (passages, adhérents distincts, à régulariser), pas de la journée. Le distinct passe par `groupBy` et non `findMany({ distinct })`, que Prisma déduplique en mémoire après avoir tout rapatrié
  - Export CSV `/api/pointage/export` — deuxième route API du projet, même raison que la première (§7). Le nom du fichier est bâti sur les dates **validées** : les paramètres bruts permettraient une injection d'en-tête dans `Content-Disposition`
  - Écran de **consultation seule**, par construction : il ne propose aucune action sur un contrat (§9)
- [x] QR du code du jour — ajouté le 05/09/2026, pour supprimer la saisie des quatre chiffres à l'accueil :
  - Le QR est affiché **à l'écran de la borne**, à côté du code, et encode `…/espace/pointer?code=XXXX`. Il porte donc le code du jour et **change avec lui** — il hérite gratuitement de la rotation quotidienne et du bouton « Changer »
  - **Interdit de l'imprimer et de le coller au mur** (rappelé dans le code et dans le texte de l'écran) : un autocollant ne change jamais, donc une photo permettrait de pointer depuis chez soi pour toujours, sans révocation possible. Ce serait la fin de la preuve de présence, qui est la seule raison d'être du code du jour
  - **Aucun pointage automatique au chargement de l'URL** : les quatre cases sont pré-remplies, l'adhérent appuie sur « Confirmer ma présence ». Un enregistrement déclenché par une simple navigation se rejouerait à chaque retour arrière et partirait depuis un lien reçu par message
  - `CarteCodeSeance` rafraîchit la page après renouvellement au lieu de garder le code dans un `useState` : le QR est fabriqué par le serveur, un état local afficherait les nouveaux chiffres à côté de l'ANCIEN QR
  - Dépendance `qrcode`, rendue en **SVG côté serveur** (net à toute échelle, zéro JavaScript envoyé)
  - `origineRequete()` extraite dans `lib/utils/url.ts` : elle était dupliquée dans `actions/invitation.ts` et `actions/espace-adherent.ts`, avec une note disant de la factoriser au troisième appelant — c'était ce troisième appelant
- [x] RLS complétée (`20260905024121_rls_tables_lot4_boutique`) — appliquée et **vérifiée en base le 05/09/2026** : les 16 tables métier portent `relrowsecurity`, contre 9 auparavant. Les 7 tables nées après la migration du 18/08 (Lot 4 et Boutique) n'avaient jamais reçu la première barrière ; seul `ALTER DEFAULT PRIVILEGES` les protégeait. Pas une fuite ouverte, mais une défense en profondeur asymétrique — elle protégeait ce qui avait été prévu et laissait passer ce qui avait été ajouté après. **Leçon : toute migration qui crée une table métier doit se terminer par son `ENABLE ROW LEVEL SECURITY`.** Vérification : la requête en pied du fichier de migration doit renvoyer 0 ligne
- [x] Tests d'isolation multi-tenant (`npm test`) — ajoutés le 05/09/2026. **La seule suite de tests du projet, et c'est volontaire** : une fuite inter-tenant est la seule faute à la fois invisible (l'écran s'affiche normalement, avec les données de la mauvaise salle) et mortelle. Tout le reste se voit à l'usage.
  - Vitest. 28 tests : la porte d'entrée (`getTenantContext` et ses quatre refus), puis chaque liste de `lib/data/*` — adhérents, recherche, abonnements, paiements, pointage, registre, export CSV, formules, produits, commandes, coachs, cours, décrochage
  - Forme constante : deux salles fictives complètes et identiques, on se connecte à l'une, on vérifie qu'**aucun identifiant de l'autre** ne remonte
  - Trois mocks, tous justifiés en tête de fichier : Clerk (la source du `gymId`), `@/lib/supabase` (le piège du WebSocket de §6, qui casse la suite sans rien apprendre) et `cache()` de React (hors moteur React, rien ne délimite la mémorisation ; un test dédié vérifie que la bascule de salle fonctionne vraiment)
  - Un test **structurel** qui refuse tout futur fichier de `lib/data/` interrogeant Prisma sans passer par `getTenantContext`, `exigerSessionAdherent` ou `getSuperAdminContext` — il couvre le code qui n'existe pas encore
  - **Validé par sabotage** : le filtre `gymId` de `listerAdherents` retiré volontairement → le test tombe. Une suite verte qui ne peut pas rougir ne prouve rien
  - Les tests écrivent dans la vraie base (il n'y en a qu'une) : identifiants tirés au hasard à chaque exécution, et nettoyage `deleteMany` borné à `gymId: { in: [les deux salles créées] }`. Aucune requête ne peut atteindre une ligne qu'ils n'ont pas écrite
- [ ] Lot 6 — paiements en ligne Wave / Orange Money — **en pause le 24/08/2026**, a la demande d'ElmaestroDEV. A reprendre plus tard.

Le **Lot 1 est le seuil de commercialisation** : une salle doit pouvoir abandonner son carnet à la fin de ce lot. Franchi le 19/08/2026, parcours rejoué de bout en bout dans le navigateur.

---

## 13. Comment je veux que tu travailles

- Réponds en **français**.
- Va droit au code. Pas de préambule, pas de récapitulatif de ce que je viens de demander.
- Code complet et fonctionnel, pas de `// TODO` ni de fonction laissée vide.
- Si une décision d'architecture a plusieurs options défendables, dis-le en deux lignes et tranche avec une recommandation. Ne me laisse pas arbitrer un choix technique que tu peux arbitrer.
- Si je te demande quelque chose qui viole une règle des §3, §4 ou §9, signale-le avant de coder.
- Quand tu proposes un schéma Prisma ou une migration, vérifie d'abord la cohérence avec les tables existantes.
