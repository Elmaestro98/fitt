import { SignIn } from "@clerk/nextjs";

export default function PageConnexion() {
  return (
    <SignIn
      signUpUrl="/inscription"
      // Ou aller apres connexion si aucune destination n'est memorisee.
      fallbackRedirectUrl="/tableau-de-bord"
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-[#FF6B35] hover:bg-[#E85D2A] text-white normal-case",
        },
      }}
    />
  );
}
