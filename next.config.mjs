/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Photos de profil televersees vers Supabase Storage (CLAUDE.md §2) :
    // next/image refuse toute source externe non listee ici.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
