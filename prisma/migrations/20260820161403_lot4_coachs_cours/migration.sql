-- CreateEnum
CREATE TYPE "StatutSessionCours" AS ENUM ('PLANIFIEE', 'ANNULEE', 'TERMINEE');

-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('CONFIRMEE', 'ANNULEE');

-- CreateTable
CREATE TABLE "coachs" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "specialite" TEXT,
    "photoUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coachs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "types_cours" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couleur" TEXT DEFAULT '#FF6B35',
    "dureeMinutes" INTEGER NOT NULL DEFAULT 60,
    "capaciteDefaut" INTEGER NOT NULL DEFAULT 15,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "types_cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_cours" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "typeCoursId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "debutLe" TIMESTAMP(3) NOT NULL,
    "dureeMinutes" INTEGER NOT NULL,
    "capacite" INTEGER NOT NULL,
    "placesReservees" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutSessionCours" NOT NULL DEFAULT 'PLANIFIEE',
    "annuleLe" TIMESTAMP(3),
    "motifAnnul" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "sessionCoursId" TEXT NOT NULL,
    "adherentId" TEXT NOT NULL,
    "statut" "StatutReservation" NOT NULL DEFAULT 'CONFIRMEE',
    "annuleLe" TIMESTAMP(3),
    "motifAnnul" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coachs_gymId_actif_idx" ON "coachs"("gymId", "actif");

-- CreateIndex
CREATE INDEX "types_cours_gymId_actif_idx" ON "types_cours"("gymId", "actif");

-- CreateIndex
CREATE UNIQUE INDEX "types_cours_gymId_nom_key" ON "types_cours"("gymId", "nom");

-- CreateIndex
CREATE INDEX "sessions_cours_gymId_debutLe_idx" ON "sessions_cours"("gymId", "debutLe");

-- CreateIndex
CREATE INDEX "sessions_cours_gymId_coachId_idx" ON "sessions_cours"("gymId", "coachId");

-- CreateIndex
CREATE INDEX "sessions_cours_gymId_typeCoursId_idx" ON "sessions_cours"("gymId", "typeCoursId");

-- CreateIndex
CREATE INDEX "reservations_gymId_adherentId_idx" ON "reservations"("gymId", "adherentId");

-- CreateIndex
CREATE INDEX "reservations_gymId_sessionCoursId_idx" ON "reservations"("gymId", "sessionCoursId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_sessionCoursId_adherentId_key" ON "reservations"("sessionCoursId", "adherentId");

-- AddForeignKey
ALTER TABLE "coachs" ADD CONSTRAINT "coachs_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "types_cours" ADD CONSTRAINT "types_cours_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_cours" ADD CONSTRAINT "sessions_cours_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_cours" ADD CONSTRAINT "sessions_cours_typeCoursId_fkey" FOREIGN KEY ("typeCoursId") REFERENCES "types_cours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_cours" ADD CONSTRAINT "sessions_cours_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coachs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_sessionCoursId_fkey" FOREIGN KEY ("sessionCoursId") REFERENCES "sessions_cours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_adherentId_fkey" FOREIGN KEY ("adherentId") REFERENCES "adherents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
