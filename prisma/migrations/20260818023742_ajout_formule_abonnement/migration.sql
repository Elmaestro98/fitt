-- CreateEnum
CREATE TYPE "UniteDuree" AS ENUM ('JOUR', 'SEMAINE', 'MOIS', 'ANNEE');

-- CreateEnum
CREATE TYPE "StatutAbonnement" AS ENUM ('ACTIF', 'EXPIRE', 'ANNULE');

-- CreateTable
CREATE TABLE "formules" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" INTEGER NOT NULL,
    "dureeValeur" INTEGER NOT NULL,
    "dureeUnite" "UniteDuree" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonnements" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "formuleId" TEXT NOT NULL,
    "nomFormule" TEXT NOT NULL,
    "prixPaye" INTEGER NOT NULL,
    "finLe" TIMESTAMP(3) NOT NULL,
    "debutLe" TIMESTAMP(3) NOT NULL,
    "statut" "StatutAbonnement" NOT NULL DEFAULT 'ACTIF',
    "annuleLe" TIMESTAMP(3),
    "motifAnnul" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abonnements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "formules_gymId_actif_idx" ON "formules"("gymId", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "formules_gymId_nom_key" ON "formules"("gymId", "nom");

-- CreateIndex
CREATE INDEX "abonnements_gymId_finLe_idx" ON "abonnements"("gymId", "finLe");

-- CreateIndex
CREATE INDEX "abonnements_gymId_adherentId_idx" ON "abonnements"("gymId", "adherentId");

-- CreateIndex
CREATE INDEX "abonnements_gymId_statut_idx" ON "abonnements"("gymId", "statut");

-- AddForeignKey
ALTER TABLE "formules" ADD CONSTRAINT "formules_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "adherents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonnements" ADD CONSTRAINT "abonnements_formuleId_fkey" FOREIGN KEY ("formuleId") REFERENCES "formules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
