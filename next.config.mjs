/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permet de builder ailleurs que dans .next quand ce dossier est verrouille
  // par un outil de developpement (extension VS Code, antivirus) — un cas
  // frequent sous Windows. Vercel n'y touche pas : la variable n'y est pas
  // definie, le dossier reste .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",

  images: {
    // Photos de profil televersees vers Supabase Storage (CLAUDE.md §2) :
    // next/image refuse toute source externe non listee ici.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
