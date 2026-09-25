import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Badge } from "@/design-system/components/Badge";
import { Field, Input, Label } from "@/design-system/components/Input";
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
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: () => {
      setOk(true);
      setCurrent("");
      setNext("");
      setConfirm("");
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
    mutationFn: authApi.disableTwoFactor,
    onSuccess: async () => { await refreshMe(); },
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
            onClick={() => { if (confirm("Desabilitar MFA?")) disableMut.mutate(); }}
            disabled={disableMut.isPending}
          >
            <ShieldOff className="size-4" />
            {disableMut.isPending ? "Desabilitando..." : "Desabilitar MFA"}
          </Button>
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
