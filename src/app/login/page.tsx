import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-radial-gradient from-common/5 to-transparent pointer-events-none" />
      <AuthForm />
    </main>
  );
}
