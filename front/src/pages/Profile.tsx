import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/design-system/components/Modal";
import { tokenStore } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Badge } from "@/design-system/components/Badge";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Skeleton } from "@/design-system/components/Skeleton";
import { useToast } from "@/design-system/components/Toast";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABEL,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferenceDTO,
} from "@/features/notifications/api";
import { authApi } from "@/features/auth/api";
import { useAuth } from "@/lib/auth-context";
import { KeyRound, Mail, Save, ShieldCheck, ShieldOff, User as UserIcon } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const qc = useQueryClient();

  return (
    <div className="space-y-6">
      <Topbar title="Perfil e segurança" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <IdentityCard user={user} />
        <UpdateProfileCard user={user} refreshMe={refreshMe} qc={qc} />
        <ChangePasswordCard />
        <TwoFactorCard user={user} refreshMe={refreshMe} />
        <NotificationPreferencesCard />
      </div>
    </div>
  );
}

function IdentityCard({ user }: any) {
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-ink">Sessão atual</h2>
        <p className="text-xs text-ink-muted">Papel e status controlam permissões.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-full bg-ink text-white grid place-items-center font-semibold">
          {user?.name?.[0] ?? "?"}
        </div>
        <div>
          <p className="text-base font-semibold text-ink">{user?.name}</p>
          <p className="text-sm text-ink-muted">{user?.email}</p>
          <div className="mt-2 flex gap-2">
            <Badge tone="brand">{user?.role}</Badge>
            <Badge tone={user?.status === "ACTIVE" ? "success" : "danger"}>{user?.status}</Badge>
          </div>
        </div>
      </div>
      <div className="divider" />
      <p className="text-xs text-ink-muted">Autenticado com JWT. Refresh automático antes de expirar.</p>
    </Card>
  );
}

function UpdateProfileCard({ user, refreshMe, qc }: any) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.id]);

  const mut = useMutation({
    mutationFn: () => authApi.updateProfile({ name, email }),
    onSuccess: async () => {
      setOk(true);
      await refreshMe();
      qc.invalidateQueries({ queryKey: ["users"] });
      setTimeout(() => setOk(false), 3000);
    },
    onError: (err: any) => setError(err.message ?? "Erro"),
  });

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Dados pessoais</h2>
        <p className="text-xs text-ink-muted">Nome e e-mail que aparecem no sistema.</p>
      </div>
      <Field>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} leadingIcon={<UserIcon className="size-4" />} />
      </Field>
      <Field>
        <Label>E-mail</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<Mail className="size-4" />} />
      </Field>
      {error && <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">{error}</p>}
      {ok && <p className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2">Dados atualizados.</p>}
      <div className="flex justify-end">
        <Button onClick={() => { setError(null); mut.mutate(); }} disabled={mut.isPending || name.length < 2 || !email.includes("@")}>
          <Save className="size-4" />
          {mut.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </Card>
  );
}

function ChangePasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: ({ tokens }) => {
      tokenStore.set(tokens.accessToken, tokens.refreshToken);
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      setOk(true);
      toast.success("Senha alterada com sucesso");
      setTimeout(() => setOk(false), 3000);
    },
    onError: (err: any) => setError(err.message ?? "Erro"),
  });

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink">Trocar senha</h2>
        <p className="text-xs text-ink-muted">Mínimo 8 caracteres. Recomenda-se ativar MFA também.</p>
      </div>
      <Field>
        <Label>Senha atual</Label>
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} leadingIcon={<KeyRound className="size-4" />} />
      </Field>
      <Field>
        <Label>Nova senha</Label>
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} leadingIcon={<KeyRound className="size-4" />} />
      </Field>
      <Field>
        <Label>Confirmar nova senha</Label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} leadingIcon={<KeyRound className="size-4" />} />
      </Field>
      {error && <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">{error}</p>}
      {ok && <p className="text-sm text-accent-success bg-accent-success/5 border border-accent-success/20 rounded-lg px-3 py-2">Senha atualizada.</p>}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setError(null);
            if (next !== confirm) { setError("Senhas não coincidem"); return; }
            mut.mutate();
          }}
          disabled={mut.isPending || current.length < 1 || next.length < 8}
        >
          <KeyRound className="size-4" />
          {mut.isPending ? "Salvando..." : "Trocar senha"}
        </Button>
      </div>
    </Card>
  );
}

function TwoFactorCard({ user, refreshMe }: any) {
  const toast = useToast();
  const [disableOpen, setDisableOpen] = useState(false);
  const [code, setCode] = useState("");
  const setupQuery = useQuery({
    queryKey: ["2fa-setup"],
    queryFn: authApi.startTwoFactor,
    enabled: !user?.twoFactorEnabled,
  });
  const confirmMut = useMutation({
    mutationFn: (c: string) => authApi.confirmTwoFactor(c),
    onSuccess: async () => { await refreshMe(); },
  });
  const disableMut = useMutation({
    mutationFn: (password: string) => authApi.disableTwoFactor(password),
    onSuccess: async () => {
      await refreshMe();
      setDisableOpen(false);
      toast.success("MFA desativado");
    },
  });

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Dois fatores (MFA)</h2>
          <p className="text-xs text-ink-muted">Camada extra usando código TOTP.</p>
        </div>
        <Badge tone={user?.twoFactorEnabled ? "success" : "warn"} dot>
          {user?.twoFactorEnabled ? "Ativo" : "Desativado"}
        </Badge>
      </div>

      {user?.twoFactorEnabled ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted">MFA ativo. Se trocou de aparelho, desabilite e configure novamente.</p>
          <Button
            variant="danger"
            onClick={() => { disableMut.reset(); setDisableOpen(true); }}
          >
            <ShieldOff className="size-4" />
            Desabilitar MFA
          </Button>
          {disableOpen && (
            <DisableMfaModal
              pending={disableMut.isPending}
              error={disableMut.error?.message ?? null}
              onSubmit={(password) => disableMut.mutate(password)}
              onClose={() => setDisableOpen(false)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {setupQuery.data?.setup && (
            <div className="grid md:grid-cols-[auto_1fr] items-center gap-4">
              <img
                src={setupQuery.data.setup.qrCodeDataUrl}
                alt="QR MFA"
                className="size-32 rounded-lg border border-line p-1 bg-white"
              />
              <div className="space-y-1 text-xs">
                <p className="font-medium text-ink">Escaneie no Google Authenticator</p>
                <p className="text-ink-muted">Ou digite: <span className="font-mono text-ink break-all">{setupQuery.data.setup.secret}</span></p>
              </div>
            </div>
          )}
          <Field>
            <Label>Código de confirmação</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              maxLength={8}
              inputMode="numeric"
              placeholder="000000"
            />
          </Field>
          <Button onClick={() => confirmMut.mutate(code)} disabled={code.length < 6 || confirmMut.isPending}>
            <ShieldCheck className="size-4" />
            {confirmMut.isPending ? "Ativando..." : "Ativar MFA"}
          </Button>
          {confirmMut.isError && <p className="text-sm text-accent-rose">Código inválido.</p>}
          {confirmMut.isSuccess && <p className="text-sm text-accent-success">MFA ativado.</p>}
        </div>
      )}
    </Card>
  );
}

const disableMfaSchema = z.object({
  password: z.string().min(1, "Informe a senha atual"),
});

function DisableMfaModal({
  pending,
  error,
  onSubmit,
  onClose,
}: {
  pending: boolean;
  error: string | null;
  onSubmit: (password: string) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof disableMfaSchema>>({ resolver: async (values) => {
      const r = disableMfaSchema.safeParse(values);
      if (r.success) return { values: r.data, errors: {} };
      return {
        values: {},
        errors: Object.fromEntries(
          r.error.issues.map((i) => [i.path[0], { type: i.code, message: i.message }]),
        ),
      };
    },
  });

  return (
    <Modal
      title="Desabilitar MFA"
      description="Por segurança, confirme sua senha atual para desativar a verificação em dois fatores."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit((v) => onSubmit(v.password))} className="space-y-4">
        <Field>
          <Label>Senha atual</Label>
          <Input
            type="password"
            autoComplete="current-password"
            autoFocus
            leadingIcon={<KeyRound className="size-4" />}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-accent-rose">{errors.password.message}</p>}
        </Field>
        {error && <p className="text-sm text-accent-rose bg-accent-rose/5 border border-accent-rose/20 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button type="submit" variant="danger" disabled={pending}>
            <ShieldOff className="size-4" />
            {pending ? "Desabilitando..." : "Desabilitar MFA"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function NotificationPreferencesCard() {
  const toast = useToast();
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const prefs: NotificationPreferenceDTO[] = NOTIFICATION_TYPES.map(
    (type) => query.data?.find((p) => p.type === type) ?? { type, inApp: true, email: true },
  );

  function toggle(type: NotificationPreferenceDTO["type"], key: "inApp" | "email", value: boolean) {
    const next = prefs.map((p) => (p.type === type ? { ...p, [key]: value } : p));
    update.mutate(next, {
      onSuccess: () => toast.success("Preferências salvas"),
      onError: (e: Error) => toast.error("Falha ao salvar preferências", e.message),
    });
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">Preferências de notificação</h2>
        <p className="text-xs text-ink-muted">Escolha como deseja ser avisado sobre cada tipo de alerta.</p>
      </div>
      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-accent-rose">Não foi possível carregar as preferências.</p>
      ) : (
        <div className="divide-y divide-line">
          <div className="grid grid-cols-[1fr_auto_auto] gap-6 pb-2 text-[11px] font-medium uppercase text-ink-muted">
            <span>Tipo</span>
            <span className="w-16 text-center">No app</span>
            <span className="w-16 text-center">E-mail</span>
          </div>
          {prefs.map((p) => (
            <div key={p.type} className="grid grid-cols-[1fr_auto_auto] items-center gap-6 py-2.5">
              <span className="text-sm text-ink">{NOTIFICATION_TYPE_LABEL[p.type]}</span>
              <span className="flex w-16 justify-center">
                <PrefSwitch
                  label={`${NOTIFICATION_TYPE_LABEL[p.type]}: no app`}
                  checked={p.inApp}
                  disabled={update.isPending}
                  onChange={(v) => toggle(p.type, "inApp", v)}
                />
              </span>
              <span className="flex w-16 justify-center">
                <PrefSwitch
                  label={`${NOTIFICATION_TYPE_LABEL[p.type]}: e-mail`}
                  checked={p.email}
                  disabled={update.isPending}
                  onChange={(v) => toggle(p.type, "email", v)}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PrefSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 ${
        checked ? "bg-brand-500" : "bg-line-strong"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
