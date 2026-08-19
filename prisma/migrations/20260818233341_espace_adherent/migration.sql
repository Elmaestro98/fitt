-- Espace adherent : le lien d'invitation et la session maison.
--
-- Deux tables, aucun compte Clerk (CLAUDE.md §5, §9) : Clerk facture au MAU,
-- et une salle de 400 adherents ferait exploser le cout. La session est donc
-- un simple jeton depose dans un cookie httpOnly, dont la base ne connait que
-- l'empreinte SHA-256.
--
-- Les deux tables portent gymId (§3) et un jetonHache unique (§4, §9) : une
-- lecture de la base ne donne acces a aucun espace.

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "jetonHache" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "utiliseLe" TIMESTAMP(3),
    "revoqueLe" TIMESTAMP(3),
    "creeParUserId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_adherent" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "jetonHache" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "revoqueLe" TIMESTAMP(3),
    "dernierAccesLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_adherent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_jetonHache_key" ON "invitations"("jetonHache");

-- CreateIndex
CREATE INDEX "invitations_gymId_adherentId_idx" ON "invitations"("gymId", "adherentId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_adherent_jetonHache_key" ON "sessions_adherent"("jetonHache");

-- CreateIndex
CREATE INDEX "sessions_adherent_gymId_adherentId_idx" ON "sessions_adherent"("gymId", "adherentId");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "adherents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_adherent" ADD CONSTRAINT "sessions_adherent_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_adherent" ADD CONSTRAINT "sessions_adherent_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "adherents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security -------------------------------------------------------
-- Ajout MANUEL, que `prisma migrate` ne genere jamais. Sans ces deux lignes,
-- les tables creees ici seraient les seules de la base sans filet, et la
-- migration 20260818225000_active_rls perdrait sa couverture des la premiere
-- table suivante.
--
-- Aucune policy, volontairement : aucune policy = tout est refuse. Prisma se
-- connecte en "postgres" (rolbypassrls), l'application n'est donc pas genee.
-- Et surtout PAS de FORCE ROW LEVEL SECURITY, qui s'appliquerait au
-- proprietaire lui-meme et couperait l'application.
--
-- Ces deux tables sont les plus sensibles du projet : elles contiennent les
-- empreintes qui ouvrent les espaces personnels.
ALTER TABLE "invitations"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions_adherent" ENABLE ROW LEVEL SECURITY;
