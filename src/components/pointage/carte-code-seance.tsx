"use client";

// Le code du jour, affiche a l'accueil.
//
// C'est ce que l'adherent recopie dans son espace pour signaler sa presence.
// Il doit donc etre LISIBLE DE LOIN : gros chiffres, espaces larges, contraste
// franc. Un code qu'on doit venir dechiffrer au comptoir ne sert a rien.
//
// /!\ Ce n'est pas un secret cryptographique : il ne donne acces a aucune
// donnee. Il atteste seulement que la personne se trouve dans la salle.
import { useState, useTransition } from "react";
import { RefreshCw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { actionRenouvelerCodeSeance } from "@/lib/actions/gym";

export function CarteCodeSeance({ codeInitial }: { codeInitial: string }) {
  const [code, setCode] = useState(codeInitial);
  const [enCours, demarrer] = useTransition();

  function renouveler() {
    demarrer(async () => {
      const resultat = await actionRenouvelerCodeSeance();
      if (resultat.code) setCode(resultat.code);
    });
  }

  return (
    <Card>
      <CardHeader
        titre="Code du jour"
        icone={<ScanLine className="size-4 text-brand" />}
        action={
          <Button
            type="button"
            variante="contour"
            onClick={renouveler}
            disabled={enCours}
          >
            <RefreshCw className={`size-4 ${enCours ? "animate-spin" : ""}`} />
            Changer
          </Button>
        }
      />
      <CardBody className="text-center">
        <p
          // tabular-nums : les chiffres gardent la meme largeur, le code ne
          // "saute" pas quand il change.
          className="font-mono text-5xl font-semibold tracking-[0.25em] text-ink tabular-nums"
        >
          {code}
        </p>
        <p className="mx-auto mt-3 max-w-sm text-xs text-muted">
          Affichez-le a l&apos;accueil. Les adherents le saisissent dans leur
          espace pour signaler leur presence. Il change automatiquement chaque
          jour — changez-le tout de suite s&apos;il a circule par WhatsApp.
        </p>
      </CardBody>
    </Card>
  );
}
