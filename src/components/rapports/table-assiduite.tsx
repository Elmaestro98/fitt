import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Avatar } from "@/components/ui/avatar";

type Ligne = {
  adherent: {
    id: string;
    prenom: string;
    nom: string;
    numero: string;
    photoUrl: string | null;
  };
  passages: number;
};

export function TableAssiduite({ lignes }: { lignes: Ligne[] }) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[420px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Adherent</TableHead>
            <TableHead className="pr-5 text-right">Passages</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l, i) => {
            const nomComplet = `${l.adherent.prenom} ${l.adherent.nom}`;

            return (
              <TableRow key={l.adherent.id}>
                <TableCell className="pl-5">
                  <Link
                    href={`/adherents/${l.adherent.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="w-5 shrink-0 text-center text-sm font-medium text-muted tabular-nums">
                      {i + 1}
                    </span>
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

                <TableCell className="pr-5 text-right font-semibold text-ink tabular-nums">
                  {l.passages}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
