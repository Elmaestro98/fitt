-- Row Level Security sur les tables creees APRES le 18/08/2026.
--
-- POURQUOI CETTE MIGRATION EXISTE
-- La migration 20260818225000_active_rls a monte une defense a deux barrieres
-- (CLAUDE.md §3) :
--   1. RLS activee sans aucune policy = "deny all" complet ;
--   2. privileges revoques aux roles publics anon / authenticated, et
--      privileges par defaut neutralises pour les tables futures.
--
-- Elle couvrait les 9 tables existantes ce jour-la. Sept tables sont nees
-- depuis — le Lot 4 (coachs et cours) le 20/08, la Boutique le 21/08 — et
-- aucune n'a jamais recu la premiere barriere :
--
--   coachs · types_cours · sessions_cours · reservations
--   produits · commandes · lignes_commande
--
-- CE N'EST PAS UNE FUITE OUVERTE AUJOURD'HUI. Le point 3 de la migration
-- d'origine (ALTER DEFAULT PRIVILEGES) fait que ces tables n'ont herite
-- d'aucun droit pour anon : PostgREST ne les voit pas. La seconde barriere
-- tient donc.
--
-- Mais la moitie du schema ne tenait que sur UNE barriere au lieu de deux. Le
-- jour ou quelqu'un execute un GRANT depuis le tableau de bord Supabase pour
-- deboguer — ca arrive —, adherents et paiements resteraient proteges par la
-- RLS pendant que le catalogue, les commandes et les reservations de TOUTES
-- les salles deviendraient lisibles. Une defense en profondeur asymetrique
-- n'est pas une defense en profondeur : elle protege ce qu'on avait prevu, et
-- laisse passer ce qu'on a ajoute apres.
--
-- POURQUOI L'APPLICATION N'EST PAS AFFECTEE
-- Meme raison qu'en aout : Prisma se connecte avec le role "postgres", qui
-- porte rolbypassrls = true et possede les tables. Il traverse la RLS sans
-- policy. Et toujours PAS de FORCE ROW LEVEL SECURITY, qui s'appliquerait au
-- proprietaire lui-meme et couperait l'application net.
--
-- LA RLS NE REMPLACE TOUJOURS PAS getTenantContext()
-- Filet de derniere instance, "jamais comme mecanisme principal" (§3).
-- L'isolation reste assuree par le filtre gymId de lib/data/*.

-- 1. La barriere manquante ---------------------------------------------------
ALTER TABLE "coachs"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "types_cours"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions_cours"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reservations"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "produits"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commandes"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lignes_commande" ENABLE ROW LEVEL SECURITY;

-- 2. Ceinture et bretelles ---------------------------------------------------
-- Redondant en theorie : ALTER DEFAULT PRIVILEGES aurait deja du empecher
-- toute concession sur ces sept tables. On le rejoue quand meme, parce que
-- cette migration doit etre vraie par elle-meme et non par l'effet suppose
-- d'une autre, ecrite trois semaines plus tot. C'est un no-op si tout va bien,
-- et le rattrapage si quelque chose a re-concede des droits entre-temps.
--
-- service_role n'est pas touche : c'est la cle SECRETE de service, jamais
-- exposee au navigateur, et elle reste utile pour l'administration du Storage.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- 3. Les tables futures ------------------------------------------------------
-- Rejoue pour la meme raison. C'est CE point qui a evite que l'oubli des sept
-- tables ci-dessus ne devienne une fuite reelle : il vaut la peine d'etre
-- reaffirme a chaque fois qu'on touche a ce sujet.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- VERIFICATION apres application (doit renvoyer 0 ligne) :
--
--   SELECT relname FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'r'
--     AND relname <> '_prisma_migrations'
--     AND NOT relrowsecurity;
