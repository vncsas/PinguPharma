import { useNavigate, Navigate } from "react-router-dom";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { FormError } from "@/design-system/ui/FormError";
import { useAuth } from "@/lib/auth-context";
import { serverError, useZodForm } from "@/lib/forms";
import { loginSchema } from "../schemas";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const nav = useNavigate();
  const form = useZodForm(loginSchema, { defaultValues: { email: "", password: "" } });
  const { register, handleSubmit, setError, formState } = form;

  if (user) return <Navigate to="/" replace />;

  const submit = handleSubmit(async ({ email, password }) => {
    try {
      const result = await signIn(email, password);
      if (result.status === "TWOFA_REQUIRED") {
        nav(`/verificar-2fa?token=${encodeURIComponent(result.challengeToken)}`);
      } else {
        nav("/");
      }
    } catch (err) {
      setError("root", serverError(err, "Falha ao autenticar"));
    }
  });

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
            Gestão farmacêutica limpa, do balcão à auditoria.
          </h1>
          <p className="text-white/80">
            Estoque por lote com FIFO, PDV com leitor de barras, dashboards financeiros e alertas de
            validade em um único painel.
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
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                {...register("email")}
                error={formState.errors.email?.message}
                leadingIcon={<Mail className="size-4" />}
              />
            </Field>
            <Field>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                error={formState.errors.password?.message}
                leadingIcon={<Lock className="size-4" />}
              />
            </Field>
            <FormError message={formState.errors.root?.message} />
            <Button type="submit" className="w-full" size="lg" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Entrando..." : "Entrar"}
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
