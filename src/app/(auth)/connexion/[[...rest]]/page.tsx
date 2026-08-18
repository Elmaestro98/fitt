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
            "bg-brand hover:bg-brand-hover text-white normal-case",
        },
      }}
    />
  );
}
