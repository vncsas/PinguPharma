import { useState } from "react";
import { Card } from "@/design-system/ui/GlassCard";
import { Button } from "@/design-system/ui/Button";
import { Badge } from "@/design-system/ui/Badge";
import { useConfirm } from "@/design-system/ui/ConfirmDialog";
import { Field, Input, Label } from "@/design-system/ui/Input";
import { useConfirmTwoFactor, useDisableTwoFactor, useTwoFactorSetup } from "@/features/auth/hooks";
import type { AuthUser } from "@/features/auth/types";
import { ShieldCheck, ShieldOff } from "lucide-react";

export function TwoFactorCard({
  user,
  refreshMe,
}: {
  user: AuthUser | null;
  refreshMe: () => Promise<void>;
}) {
  const confirm = useConfirm();
  const [code, setCode] = useState("");
  const setupQuery = useTwoFactorSetup(!user?.twoFactorEnabled);
  const confirmMut = useConfirmTwoFactor();
  const disableMut = useDisableTwoFactor();

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
          <p className="text-sm text-ink-muted">
            MFA ativo. Se trocou de aparelho, desabilite e configure novamente.
          </p>
          <Button
            variant="danger"
            onClick={async () => {
              if (
                await confirm({
                  title: "Desabilitar MFA?",
                  confirmLabel: "Desabilitar",
                  danger: true,
                })
              ) {
                disableMut.mutate(undefined, { onSuccess: refreshMe });
              }
            }}
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
                <p className="text-ink-muted">
                  Ou digite:{" "}
                  <span className="font-mono text-ink break-all">
                    {setupQuery.data.setup.secret}
                  </span>
                </p>
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
          <Button
            onClick={() => confirmMut.mutate(code, { onSuccess: refreshMe })}
            disabled={code.length < 6 || confirmMut.isPending}
          >
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
