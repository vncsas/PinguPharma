import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { passwordResetApi } from "@/features/auth/password-reset";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await passwordResetApi.request(email);
      setSent(true);
      if (res.devToken) setDevToken(res.devToken);
    } catch (err) {
      setError(errorMessage(err, "Erro ao solicitar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-surface-canvas p-6">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div>
          <p className="text-xs font-medium text-brand-500 uppercase tracking-wider">Recuperação</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Esqueci minha senha</h1>
          <p className="text-sm text-ink-muted mt-1">
            Digite o e-mail cadastrado. Enviaremos um link de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-3">
              Se o e-mail existir, você receberá o link. Verifique a caixa de spam.
            </div>
            {devToken && (
              <div className="text-xs bg-surface-alt border border-line rounded-lg p-3 space-y-2">
                <p className="font-semibold text-ink">[Modo DEV] Token gerado localmente:</p>
                <p className="font-mono break-all">{devToken}</p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => nav(`/redefinir-senha?token=${encodeURIComponent(devToken)}`)}
                >
                  Ir para redefinição <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-brand-500 hover:underline"
            >
              <ArrowLeft className="size-4" /> Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<Mail className="size-4" />}
                required
              />
            </Field>
            {error && <p className="text-sm text-accent-rose">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              <KeyRound className="size-4" />
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-brand-500 hover:underline"
            >
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Senhas não coincidem");
      return;
    }
    setLoading(true);
    try {
      await passwordResetApi.confirm(token, password);
      setDone(true);
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setError(errorMessage(err, "Erro ao redefinir"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md text-center">
          <p className="text-sm">Token ausente. Solicite um novo link.</p>
          <Link to="/esqueci-senha" className="text-brand-500 text-sm underline">
            Voltar
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-surface-canvas p-6">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div>
          <p className="text-xs font-medium text-brand-500 uppercase tracking-wider">Nova senha</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Escolha uma nova senha</h1>
          <p className="text-sm text-ink-muted mt-1">Mínimo 8 caracteres.</p>
        </div>
        {done ? (
          <div className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-3">
            Senha redefinida! Redirecionando ao login...
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field>
              <Label>Nova senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field>
              <Label>Confirmar senha</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            {error && <p className="text-sm text-accent-rose">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading || password.length < 8}>
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
