"use client";

// Saisie du code de seance, dans l'espace adherent.
//
// Quatre cases, clavier numerique, gros caracteres : cet ecran est utilise
// debout, a l'entree de la salle, souvent d'une seule main (§11).
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlerteFormulaire } from "@/components/ui/form";
import { actionPointerEspace } from "@/lib/actions/espace-pointage";

const CASES = [0, 1, 2, 3];

export function FormulairePointage() {
  const router = useRouter();
  const [chiffres, setChiffres] = useState(["", "", "", ""]);
  const [message, setMessage] = useState<string | null>(null);
  const [fait, setFait] = useState(false);
  const [enCours, demarrer] = useTransition();
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const code = chiffres.join("");

  function saisir(index: number, valeur: string) {
    const chiffre = valeur.replace(/\D/g, "").slice(-1);

    setChiffres((precedent) => {
      const suivant = [...precedent];
      suivant[index] = chiffre;
      return suivant;
    });
    setMessage(null);

    // Avance automatique : on ne demande pas a quelqu'un qui tient son sac de
    // viser quatre champs a la suite.
    if (chiffre && index < 3) refs.current[index + 1]?.focus();
  }

  function touche(index: number, evenement: React.KeyboardEvent) {
    if (evenement.key === "Backspace" && !chiffres[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function coller(evenement: React.ClipboardEvent) {
    const colle = evenement.clipboardData.getData("text").replace(/\D/g, "");
    if (colle.length < 2) return;

    evenement.preventDefault();
    const suivant = ["", "", "", ""];
    for (let i = 0; i < 4; i++) suivant[i] = colle[i] ?? "";
    setChiffres(suivant);
    refs.current[Math.min(colle.length, 3)]?.focus();
  }

  function envoyer() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await actionPointerEspace(code);

      if (resultat.succes) {
        setFait(true);
        router.refresh();
        return;
      }

      setMessage(resultat.message ?? "Le pointage a echoue.");
      setChiffres(["", "", "", ""]);
      refs.current[0]?.focus();
    });
  }

  if (fait) {
    return (
      <div className="space-y-3 py-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft">
          <Check className="size-7 text-success" />
        </span>
        <p className="font-semibold text-ink">Presence enregistree</p>
        <p className="mx-auto max-w-xs text-sm text-muted">
          Bonne seance. Votre venue apparait desormais dans vos seances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && <AlerteFormulaire>{message}</AlerteFormulaire>}

      <div className="flex justify-center gap-2" onPaste={coller}>
        {CASES.map((index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={chiffres[index]}
            onChange={(e) => saisir(index, e.target.value)}
            onKeyDown={(e) => touche(index, e)}
            // inputMode numeric : clavier a chiffres sur telephone, sans les
            // fleches d'un input type=number.
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            aria-label={`Chiffre ${index + 1} du code`}
            className="size-14 rounded-control border border-line bg-sunken text-center text-2xl font-semibold text-ink focus:border-brand focus:outline-none"
          />
        ))}
      </div>

      <Button
        type="button"
        onClick={envoyer}
        disabled={enCours || code.length < 4}
        className="h-12 w-full"
      >
        {enCours && <Loader2 className="size-4 animate-spin" />}
        {enCours ? "Enregistrement..." : "Je suis la"}
      </Button>
    </div>
  );
}
