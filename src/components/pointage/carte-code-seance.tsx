"use client";

// Le code du jour, affiche a l'accueil.
//
// Deux facons de s'en servir, cote a cote :
//   - le QR, que l'adherent scanne avec l'appareil photo de son telephone ;
//   - les quatre chiffres, qu'il recopie si le scan echoue ou s'il n'a pas
//     encore compris le QR.
// Les deux portent EXACTEMENT le meme code du jour, donc la meme preuve de
// presence. Le QR ne fait que supprimer la saisie.
//
// /!\ Ce code n'est pas un secret cryptographique : il ne donne acces a
// aucune donnee. Il atteste seulement que la personne se trouve dans la
// salle — d'ou le fait qu'il change chaque jour, et qu'on puisse le
// renouveler sur-le-champ s'il a circule par WhatsApp.
//
// /!\ Le QR ne doit JAMAIS etre imprime et colle au mur. Un autocollant ne
// change jamais : photographie une fois, il permettrait de pointer depuis
// chez soi pour toujours, sans possibilite de le revoquer. Affiche a
// l'ecran, il herite au contraire de la rotation quotidienne du code.
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { actionRenouvelerCodeSeance } from "@/lib/actions/gym";

export function CarteCodeSeance({
  code,
  qrSvg,
}: {
  code: string;
  /** Balise <svg> generee cote serveur par lib/utils/qr.ts. */
  qrSvg: string;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();

  function renouveler() {
    demarrer(async () => {
      await actionRenouvelerCodeSeance();
      // /!\ On rafraichit au lieu de poser le nouveau code dans un state
      // local : le QR est fabrique par le serveur. Garder le code en memoire
      // ici afficherait les nouveaux chiffres a cote de l'ANCIEN QR — deux
      // codes contradictoires sur le meme ecran, et un adherent qui scanne
      // se verrait refuser son pointage sans comprendre pourquoi.
      router.refresh();
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
      <CardBody>
        <div
          className={`flex flex-col items-center gap-6 sm:flex-row sm:justify-center ${
            enCours ? "opacity-50 transition-opacity" : ""
          }`}
        >
          <div className="text-center">
            {/* Le SVG vient de notre propre generateur, jamais d'une saisie :
                il n'y a aucun contenu exterieur a echapper ici. */}
            <div
              // La bibliotheque fixe width/height sur le <svg> : sans forcer
              // sa largeur ici, il deborderait du cadre au lieu de s'y
              // adapter. Le viewBox fait le reste, le motif reste net.
              className="mx-auto w-40 rounded-control border border-line bg-white p-2 [&>svg]:h-auto [&>svg]:w-full sm:w-44"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-2 text-xs text-muted">Scannez avec votre appareil photo</p>
          </div>

          <div className="text-center">
            <p className="text-xs tracking-wide text-muted uppercase">
              ou saisissez
            </p>
            <p
              // tabular-nums : les chiffres gardent la meme largeur, le code
              // ne "saute" pas quand il change.
              className="font-mono text-5xl font-semibold tracking-[0.25em] text-ink tabular-nums"
            >
              {code}
            </p>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-md text-center text-xs text-muted">
          Affichez cet ecran a l&apos;accueil. Le code change automatiquement
          chaque jour — changez-le tout de suite s&apos;il a circule par
          WhatsApp. N&apos;imprimez pas ce QR : colle au mur, il ne changerait
          plus jamais.
        </p>
      </CardBody>
    </Card>
  );
}
