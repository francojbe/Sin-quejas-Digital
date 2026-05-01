import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para permitir acceso desde dispositivos en la red local
  // @ts-ignore - propiedad requerida en Next 15+ para evitar error 403 en IPs locales
  allowedDevOrigins: ['192.168.1.83', 'better-kings-serve.loca.lt'],
};

export default nextConfig;
