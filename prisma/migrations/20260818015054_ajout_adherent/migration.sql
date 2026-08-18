-- CreateEnum
CREATE TYPE "StatutAdherent" AS ENUM ('ACTIF', 'EXPIRE', 'SUSPENDU', 'EN_ATTENTE_VALIDATION', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('HOMME', 'FEMME');

-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "dernierNumeroAdherent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "adherents" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "sexe" "Sexe",
    "adresse" TEXT,
    "photoUrl" TEXT,
    "statut" "StatutAdherent" NOT NULL DEFAULT 'ACTIF',
    "notes" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adherents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adherents_gymId_statut_idx" ON "adherents"("gymId", "statut");

-- CreateIndex
CREATE INDEX "adherents_gymId_creeLe_idx" ON "adherents"("gymId", "creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "adherents_gymId_telephone_key" ON "adherents"("gymId", "telephone");

-- CreateIndex
CREATE UNIQUE INDEX "adherents_gymId_numero_key" ON "adherents"("gymId", "numero");

-- AddForeignKey
ALTER TABLE "adherents" ADD CONSTRAINT "adherents_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
