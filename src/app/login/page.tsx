import { AuthForm } from "@/components/auth/AuthForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/fondo-login.jpg"
          alt="Background"
          fill
          className="object-cover scale-100"
          priority
        />
        {/* Capa de profundidad oscura sutil para legibilidad sin empañar */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Resplandores ambientales dinámicos */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-common/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-special/20 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        {/* Logo Branding */}
        <div className="flex flex-col items-center animate-fade-in">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-common/20 border border-white/20 mb-2 ring-4 ring-white/5">
            <Image src="/logo-app.png" alt="Logo" width={96} height={96} className="object-cover" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
            SIN QUEJAS <span className="text-common">DIGITAL</span>
          </h1>
        </div>

        <AuthForm />
      </div>
    </main>
  );
}
