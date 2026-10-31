import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(email, password);
      if (result.status === "TWOFA_REQUIRED") {
        nav(`/verificar-2fa?token=${encodeURIComponent(result.challengeToken)}`);
      } else {
        nav("/");
      }
    } catch (err: any) {
      setError(err.message ?? "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr] bg-surface-canvas">
      <div className="hidden lg:flex flex-col justify-between p-14 bg-brand-500 text-white relative overflow-hidden">
        <div className="flex items-center gap-3">
          <img
            src="/pingu.png"
            alt="PinguPharma"
            className="size-10 object-contain"
            style={{ mixBlendMode: "lighten" }}
          />
          <span className="font-semibold text-lg">PinguPharma</span>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Gestão da farmácia pública, da dispensação à auditoria.
          </h1>
          <p className="text-white/80">
            Estoque por lote com FEFO, dispensação rastreada por paciente e receita, controle de
            medicamentos controlados e alertas de validade em um único painel.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Bullet>Rastreabilidade total por lote</Bullet>
            <Bullet>MFA por TOTP</Bullet>
            <Bullet>Papéis granulares</Bullet>
            <Bullet>API REST versionada</Bullet>
          </div>
        </div>

        <p className="text-xs text-white/60">© PinguPharma · versão beta</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div>
            <p className="text-xs font-medium text-brand-500 uppercase tracking-wider">Entrar</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Acesse sua conta</h2>
            <p className="text-sm text-ink-muted mt-1">
              Use suas credenciais corporativas. Se o MFA estiver ativo pediremos o código.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Field>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<Mail className="size-4" />}
                required
              />
            </Field>
            <Field>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leadingIcon={<Lock className="size-4" />}
                required
              />
            </Field>
            {error && (
              <div className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight className="size-4" />
            </Button>
            <a
              href="/esqueci-senha"
              className="block text-center text-xs text-brand-500 hover:underline"
            >
              Esqueci minha senha
            </a>
          </form>
          {import.meta.env.DEV && (
            <div className="text-xs text-ink-muted border-t border-line pt-4">
              <p className="font-medium text-ink flex items-center gap-1.5 mb-1">
                <ShieldCheck className="size-3.5 text-brand-500" /> Ambiente de desenvolvimento
              </p>
              <p>Rode o seed do banco para criar contas iniciais.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/90">
      <span className="size-1.5 rounded-full bg-white" />
      {children}
    </div>
  );
}
