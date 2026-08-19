-- Auto-pointage depuis l'espace adherent (CLAUDE.md §5, §9).
--
-- Deux ajouts, un seul objectif : permettre a l'adherent de signaler sa
-- presence depuis son telephone SANS rendre le registre de la salle
-- fantaisiste.
--
--   SourcePointage.ADHERENT : distingue ces passages dans les rapports. Le
--     gerant doit pouvoir repondre a "qui a pointe pour de vrai ?".
--   gyms.codePointage        : les 4 chiffres affiches a l'accueil, tires
--     chaque jour. C'est la preuve que l'adherent etait bien dans la salle.
--
-- Aucune table nouvelle ici : rien a ajouter a la RLS de la migration
-- 20260818225000_active_rls, qui couvre deja gyms et pointages.

-- AlterEnum
ALTER TYPE "SourcePointage" ADD VALUE 'ADHERENT';

-- AlterTable
ALTER TABLE "gyms" ADD COLUMN     "codePointage" TEXT,
ADD COLUMN     "codePointageLe" TIMESTAMP(3);
