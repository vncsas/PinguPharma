import { useState } from "react";
import { FormError } from "@/design-system/ui/FormError";
import { serverError, useZodForm } from "@/lib/forms";
import { forgotPasswordSchema, resetPasswordSchema } from "../schemas";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { passwordResetApi } from "@/features/auth/password-reset";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const nav = useNavigate();
  const { register, handleSubmit, setError, formState } = useZodForm(forgotPasswordSchema, {
    defaultValues: { email: "" },
  });

  const submit = handleSubmit(async ({ email }) => {
    try {
      const res = await passwordResetApi.request(email);
      setSent(true);
      if (res.devToken) setDevToken(res.devToken);
    } catch (err) {
      setError("root", serverError(err, "Erro ao solicitar"));
    }
  });

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
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field>
              <Label>E-mail</Label>
              <Input
                type="email"
                {...register("email")}
                error={formState.errors.email?.message}
                leadingIcon={<Mail className="size-4" />}
              />
            </Field>
            <FormError message={formState.errors.root?.message} />
            <Button type="submit" className="w-full" size="lg" disabled={formState.isSubmitting}>
              <KeyRound className="size-4" />
              {formState.isSubmitting ? "Enviando..." : "Enviar link"}
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
  const [done, setDone] = useState(false);
  const nav = useNavigate();
  const { register, handleSubmit, setError, formState } = useZodForm(resetPasswordSchema, {
    defaultValues: { password: "", confirm: "" },
  });

  const submit = handleSubmit(async ({ password }) => {
    try {
      await passwordResetApi.confirm(token, password);
      setDone(true);
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setError("root", serverError(err, "Erro ao redefinir"));
    }
  });

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
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field>
              <Label>Nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("password")}
                error={formState.errors.password?.message}
              />
            </Field>
            <Field>
              <Label>Confirmar senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                {...register("confirm")}
                error={formState.errors.confirm?.message}
              />
            </Field>
            <FormError message={formState.errors.root?.message} />
            <Button type="submit" className="w-full" size="lg" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
