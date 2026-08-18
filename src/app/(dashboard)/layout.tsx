// Habillage commun a tout le back-office : barre laterale + barre haute.
// Toute page placee dans (dashboard)/ en herite automatiquement.
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
