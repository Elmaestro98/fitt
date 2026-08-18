import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { joursRestants } from "@/lib/utils/duree";
import { cn } from "@/lib/utils/cn";

type Ligne = {
  id: string;
  nomFormule: string;
  finLe: Date;
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
};

export function TableExpirations({ lignes }: { lignes: Ligne[] }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[620px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Adherent</TableHead>
            <TableHead>Formule</TableHead>
            <TableHead>Expire le</TableHead>
            <TableHead className="pr-5 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l) => {
            const restants = joursRestants(l.finLe);
            const urgent = restants <= 3;
            const nomComplet = `${l.adherent.prenom} ${l.adherent.nom}`;

            return (
              <TableRow key={l.id}>
                <TableCell className="pl-5">
                  <Link
                    href={`/adherents/${l.adherent.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar nom={nomComplet} photoUrl={l.adherent.photoUrl} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">
                        {nomComplet}
                      </span>
                      <span className="block font-mono text-xs text-muted">
                        {l.adherent.numero}
                      </span>
                    </span>
                  </Link>
                </TableCell>

                <TableCell className="text-muted">{l.nomFormule}</TableCell>

                <TableCell>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap",
                      urgent ? "font-medium text-danger" : "text-ink",
                    )}
                  >
                    {urgent && <AlertTriangle className="size-4" />}
                    {formatDate(l.finLe)}
                    <span className="text-muted">
                      ({restants} j)
                    </span>
                  </span>
                </TableCell>

                <TableCell className="pr-5 text-right">
                  <Link href={`/adherents/${l.adherent.id}/abonnement`}>
                    <Button variante="contour" taille="sm">
                      <RefreshCw className="size-4" />
                      Renouveler
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
