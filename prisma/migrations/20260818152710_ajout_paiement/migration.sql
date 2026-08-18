-- CreateEnum
CREATE TYPE "MethodePaiement" AS ENUM ('ESPECES', 'WAVE', 'ORANGE_MONEY');

-- CreateEnum
CREATE TYPE "TypePaiement" AS ENUM ('ENCAISSEMENT', 'ANNULATION');

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "abonnementId" TEXT,
    "montant" INTEGER NOT NULL,
    "methode" "MethodePaiement" NOT NULL,
    "type" "TypePaiement" NOT NULL DEFAULT 'ENCAISSEMENT',
    "reference" TEXT,
    "note" TEXT,
    "annuleId" TEXT,
    "motif" TEXT,
    "encaisseLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paiements_annuleId_key" ON "paiements"("annuleId");

-- CreateIndex
CREATE INDEX "paiements_gymId_encaisseLe_idx" ON "paiements"("gymId", "encaisseLe");

-- CreateIndex
CREATE INDEX "paiements_gymId_adherentId_idx" ON "paiements"("gymId", "adherentId");

-- CreateIndex
CREATE INDEX "paiements_gymId_abonnementId_idx" ON "paiements"("gymId", "abonnementId");

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "adherents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_abonnementId_fkey" FOREIGN KEY ("abonnementId") REFERENCES "abonnements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_annuleId_fkey" FOREIGN KEY ("annuleId") REFERENCES "paiements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
