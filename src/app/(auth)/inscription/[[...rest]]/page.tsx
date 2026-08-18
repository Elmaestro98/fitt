import { SignUp } from "@clerk/nextjs";

export default function PageInscription() {
  return (
    <SignUp
      signInUrl="/connexion"
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
