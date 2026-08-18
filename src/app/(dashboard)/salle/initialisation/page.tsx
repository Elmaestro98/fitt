// Etape de mise en route : cree la ligne `gyms` correspondant a l'organisation
// Clerk qui vient d'etre creee, puis renvoie vers le tableau de bord.
//
// Le selecteur d'organisation pointe ici via afterCreateOrganizationUrl.
import { redirect } from "next/navigation";
import { synchroniserSalleDepuisClerk } from "@/lib/data/gym";

export default async function PageInitialisationSalle() {
  await synchroniserSalleDepuisClerk();
  redirect("/tableau-de-bord");
}
