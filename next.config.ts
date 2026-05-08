import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true' ? 'export' : 'standalone',
  images: {
    unoptimized: true,
  },
  // Configuración para permitir acceso desde dispositivos en la red local
  // @ts-ignore - propiedad requerida en Next 15+ para evitar error 403 en IPs locales
  allowedDevOrigins: ['192.168.1.83', 'better-kings-serve.loca.lt'],
  trailingSlash: true,
  // Optimización de Build para servidores con poca RAM (Easypanel)
  typescript: {
    ignoreBuildErrors: true, // Yo ya valido los tipos en local
  },
  eslint: {
    ignoreDuringBuilds: true, // Ahorra tiempo y CPU
  },
  // Limitar procesos en paralelo para evitar saturar la RAM
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
