import { Card } from "@/design-system/ui/GlassCard";
import { Badge } from "@/design-system/ui/Badge";
import type { AuthUser } from "@/features/auth/types";

export function IdentityCard({ user }: { user: AuthUser | null }) {
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
      <p className="text-xs text-ink-muted">
        Autenticado com JWT. Refresh automático antes de expirar.
      </p>
    </Card>
  );
}
