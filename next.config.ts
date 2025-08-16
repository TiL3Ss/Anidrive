import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    // Añade aquí los dominios de tus proveedores de imágenes
    domains: ['cdn.myanimelist.net'],
  },
   eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
