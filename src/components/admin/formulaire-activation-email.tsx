"use client";

// Active une salle en retrouvant son organisation Clerk a partir de l'e-mail
// de son gerant — le Super Admin ne connait jamais l'id interne d'une salle
// qui vient de s'inscrire, seulement l'adresse de la personne qui l'a fait.
import { useActionState } from "react";
import { CheckCircle2, Loader2, Mail, TriangleAlert } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  actionActiverSalleParEmail,
  type EtatActivationEmail,
} from "@/lib/actions/admin";
import { cn } from "@/lib/utils/cn";

const ETAT_INITIAL: EtatActivationEmail = {};

export function FormulaireActivationEmail() {
  const [etat, action, enCours] = useActionState(
    actionActiverSalleParEmail,
    ETAT_INITIAL,
  );

  return (
    <Card className="gap-0 rounded-card border-admin-line bg-admin-surface py-4 text-admin-text">
      <CardContent className="px-4">
        <p className="text-sm font-medium">Activer une salle par e-mail</p>
        <p className="mt-0.5 text-xs text-admin-muted">
          L&apos;adresse du compte qui a cree l&apos;organisation dans Fitt.
        </p>

        <form action={action} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-admin-muted" />
            <Input
              type="email"
              name="email"
              required
              placeholder="gerant@exemple.sn"
              className={cn(
                "h-10 rounded-control border-admin-line bg-admin-bg",
                "pr-3 pl-9 text-sm text-admin-text placeholder:text-admin-muted",
                "focus-visible:border-admin-accent focus-visible:ring-admin-accent/30",
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={enCours}
            className="h-10 shrink-0 rounded-control bg-admin-accent px-4 text-white hover:bg-admin-accent/90 focus-visible:ring-admin-accent"
          >
            {enCours && <Loader2 className="size-4 animate-spin" />}
            {enCours ? "Recherche..." : "Activer"}
          </Button>
        </form>

        {etat.erreur && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-admin-danger">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {etat.erreur}
          </p>
        )}
        {etat.succes && (
          <p className="mt-3 flex items-start gap-1.5 text-sm text-admin-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            {etat.succes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
