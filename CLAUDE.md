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
| Auth staff | Clerk + Organizations | oui |
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

**Clerk v6 + Next.js 15**
Le middleware se nomme `src/proxy.ts`. Pas `middleware.ts`. Ne pas passer à Next.js 16 sans vérifier la compatibilité Clerk.

**Prisma sur Vercel**
`prisma generate` dans le script `build`. Instance Prisma en singleton pour éviter l'épuisement du pool en dev.

**Hydratation**
Tout store client (Zustand) lu au premier rendu provoque une erreur d'hydratation. Pattern : `useState(false)` + `useEffect(() => setMounted(true))`.

**TypeScript 6 incompatible avec Next.js 15**
`npm i -D typescript` installe la 6.x, qui rejette `import "./globals.css"` (erreur TS2882 : *Cannot find module or type declarations for side-effect import*). Next 15 ne déclare que `*.module.css`. Rester en `typescript@^5`.

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

| Rôle | Valeur |
|---|---|
| Primaire | `#FF6B35` |
| Fond sombre / sidebar | `#0F172A` |
| Succès | `#16A34A` |
| Alerte | `#F59E0B` |
| Danger | `#DC2626` |
| Texte | `#1E293B` / secondaire `#64748B` |
| Bordures | `#E2E8F0` |

Rayons 12 px. Ombres douces. Police Inter ou Poppins. Icônes en trait fin.
**Mobile-first strict** : le back-office est utilisé sur téléphone à l'accueil. Cibles tactiles ≥ 44 px, utilisable à une main, testé à partir de 360 px de large.

---

## 12. Avancement

- [x] Cahier des charges v1.0
- [x] Maquettes Stitch : tableau de bord, liste adhérents, fiche adhérent, modale paiement, pointage kiosque, landing
- [ ] Maquettes : invitation d'adhérents, import CSV, formules, création adhérent
- [ ] Lot 0 — socle technique, tenant, RLS, design system
- [ ] Lot 1 — MVP vendable (adhérents, invitations, formules, abonnements, paiements, pointage, tableau de bord)
- [ ] Lot 2 — notifications WhatsApp, relances, import CSV, impayés
- [ ] Lot 3 — espace adhérent
- [ ] Lot 4 — cours et coachs
- [ ] Lot 5 — rapports et back-office Super Admin
- [ ] Lot 6 — paiements en ligne Wave / Orange Money

Le **Lot 1 est le seuil de commercialisation** : une salle doit pouvoir abandonner son carnet à la fin de ce lot.

---

## 13. Comment je veux que tu travailles

- Réponds en **français**.
- Va droit au code. Pas de préambule, pas de récapitulatif de ce que je viens de demander.
- Code complet et fonctionnel, pas de `// TODO` ni de fonction laissée vide.
- Si une décision d'architecture a plusieurs options défendables, dis-le en deux lignes et tranche avec une recommandation. Ne me laisse pas arbitrer un choix technique que tu peux arbitrer.
- Si je te demande quelque chose qui viole une règle des §3, §4 ou §9, signale-le avant de coder.
- Quand tu proposes un schéma Prisma ou une migration, vérifie d'abord la cohérence avec les tables existantes.
