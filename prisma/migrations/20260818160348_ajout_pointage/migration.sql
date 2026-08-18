-- CreateEnum
CREATE TYPE "SourcePointage" AS ENUM ('KIOSQUE', 'STAFF');

-- CreateTable
CREATE TABLE "pointages" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "SourcePointage" NOT NULL DEFAULT 'KIOSQUE',
    "statutAdherent" "StatutAdherent" NOT NULL,
    "cleLocale" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pointages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pointages_gymId_horodatage_idx" ON "pointages"("gymId", "horodatage");

-- CreateIndex
CREATE INDEX "pointages_gymId_adherentId_horodatage_idx" ON "pointages"("gymId", "adherentId", "horodatage");

-- CreateIndex
CREATE UNIQUE INDEX "pointages_gymId_cleLocale_key" ON "pointages"("gymId", "cleLocale");

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pointages" ADD CONSTRAINT "pointages_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "adherents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
