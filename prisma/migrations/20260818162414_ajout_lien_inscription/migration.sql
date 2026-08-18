-- AlterTable
ALTER TABLE "adherents" ADD COLUMN     "lienInscriptionId" TEXT;

-- CreateTable
CREATE TABLE "liens_inscription" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "jetonHache" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "revoqueLe" TIMESTAMP(3),
    "usagesMax" INTEGER,
    "usages" INTEGER NOT NULL DEFAULT 0,
    "creeParUserId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liens_inscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "liens_inscription_jetonHache_key" ON "liens_inscription"("jetonHache");

-- CreateIndex
CREATE INDEX "liens_inscription_gymId_creeLe_idx" ON "liens_inscription"("gymId", "creeLe");

-- AddForeignKey
ALTER TABLE "adherents" ADD CONSTRAINT "adherents_lienInscriptionId_fkey" FOREIGN KEY ("lienInscriptionId") REFERENCES "liens_inscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liens_inscription" ADD CONSTRAINT "liens_inscription_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
