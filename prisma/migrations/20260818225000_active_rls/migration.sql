-- Row Level Security — le filet de securite de derniere instance (CLAUDE.md §3).
--
-- POURQUOI cette migration existe
-- Supabase expose une API REST publique (PostgREST) sur tout le schema
-- "public", et accorde par defaut aux roles "anon" et "authenticated" les
-- droits SELECT/INSERT/UPDATE/DELETE/TRUNCATE sur chaque table creee.
-- Constate sur cette base le 18/08/2026 : "anon" pouvait lire ET tronquer
-- adherents, paiements, pointages et liens_inscription — de TOUTES les salles.
-- Or la cle "anon" est publique par conception : elle est faite pour partir
-- dans un navigateur. C'etait donc la fuite inter-tenant que le §3 decrit
-- comme mortelle pour le produit, grande ouverte.
--
-- CE QUE FAIT CETTE MIGRATION
--   1. active la RLS sur toutes les tables, SANS creer la moindre policy.
--      Aucune policy = tout est refuse. C'est un "deny all" complet ;
--   2. revoque les privileges des roles publics, en seconde barriere ;
--   3. neutralise les privileges par defaut, pour que les TABLES FUTURES
--      creees par les prochaines migrations n'heritent plus de ces droits.
--      Sans ce troisieme point, la prochaine migration rouvrirait la faille.
--
-- POURQUOI L'APPLICATION N'EST PAS AFFECTEE
-- Verifie avant d'ecrire ceci : Prisma se connecte avec le role "postgres",
-- qui porte rolbypassrls = true et possede les tables. Il traverse donc la
-- RLS sans policy. C'est aussi la raison pour laquelle on n'utilise PAS
-- FORCE ROW LEVEL SECURITY : cela s'appliquerait au proprietaire lui-meme et
-- couperait l'application.
--
-- LA RLS NE REMPLACE PAS getTenantContext()
-- Le §3 est explicite : filet de derniere instance, "jamais comme mecanisme
-- principal". L'isolation reste assuree par le filtre gymId de lib/data/*.
-- Cette migration ferme une porte laterale, elle ne dispense de rien.

-- 1. RLS partout ------------------------------------------------------------
ALTER TABLE "gyms"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "adherents"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "formules"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "abonnements"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "paiements"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pointages"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "liens_inscription"  ENABLE ROW LEVEL SECURITY;
-- NOTE : pas d'ALTER TABLE sur "_prisma_migrations" ici. Prisma applique
-- d'abord chaque migration sur une shadow database, ou cette table n'existe
-- pas encore : la commande y echouerait (42P01). Le REVOKE de l'etape 2
-- la couvre de toute facon, puisqu'il porte sur ALL TABLES.

-- 2. Retrait des privileges des roles publics --------------------------------
-- service_role n'est pas touche : c'est la cle SECRETE de service, jamais
-- exposee au navigateur, et elle reste utile pour l'administration.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Sans usage sur le schema, impossible meme de nommer une table.
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- 3. Les tables futures n'heriteront plus de ces droits ----------------------
-- Les migrations Prisma s'executent en tant que "postgres" : ce sont ses
-- privileges par defaut qu'il faut corriger.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
