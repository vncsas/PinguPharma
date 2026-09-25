import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck } from "lucide-react";

export default function Verify2FAPage() {
  const { verify2fa } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) return <Navigate to="/login" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verify2fa(token!, code);
      nav("/");
    } catch (err: any) {
      setError(err.message ?? "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-surface-canvas p-6">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div>
          <p className="text-xs font-medium text-brand-500 uppercase tracking-wider">Verificação em duas etapas</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Insira o código do app</h1>
          <p className="text-sm text-ink-muted mt-1">
            Abra Google Authenticator ou 1Password e cole os 6 dígitos exibidos.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field>
            <Label htmlFor="code">Código TOTP</Label>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              leadingIcon={<ShieldCheck className="size-4" />}
              placeholder="000000"
              required
            />
          </Field>
          {error && (
            <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading || code.length < 6}>
            {loading ? "Verificando..." : "Confirmar acesso"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
