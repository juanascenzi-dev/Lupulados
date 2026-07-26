import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/context/AdminAuthContext";

const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { access, signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (access === "admin") navigate("/admin", { replace: true });
  }, [access, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await signIn(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "No se pudo iniciar sesión.");
      return;
    }
    navigate("/admin", { replace: true });
  };

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-background text-white flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-white/10 rounded-lg p-6 space-y-5">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-lg bg-primary text-black flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">Admin Lupulados</h1>
          <p className="text-sm text-muted-foreground">Ingresá con tu usuario administrativo.</p>
        </div>

        {access === "unconfigured" && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            Supabase no está configurado. Revisá las variables públicas antes de iniciar sesión.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "admin-login-error" : undefined}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">Contraseña</Label>
          <div className="flex gap-2">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "admin-login-error" : undefined}
              className="bg-black/40 border-white/10 text-white"
            />
            <Button type="button" variant="outline" onClick={() => setShowPassword((value) => !value)} aria-label="Mostrar u ocultar contraseña">
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {error && <p id="admin-login-error" className="text-sm text-red-300" role="alert">{error}</p>}

        <Button type="submit" disabled={submitting || access === "unconfigured"} aria-busy={submitting} className="w-full bg-primary text-black hover:bg-amber-500">
          {submitting ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>
    </main>
  );
}
