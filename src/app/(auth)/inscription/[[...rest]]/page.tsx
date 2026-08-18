import { SignUp } from "@clerk/nextjs";

export default function PageInscription() {
  return (
    <SignUp
      signInUrl="/connexion"
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
