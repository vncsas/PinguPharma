import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Badge } from "@/design-system/components/Badge";
import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="space-y-6">
      <Topbar title={title} />
      <Card className="text-center py-16 space-y-4">
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Construction className="size-5" />
        </div>
        <Badge tone="warn" dot>Próxima iteração</Badge>
        <h2 className="text-xl font-semibold text-ink max-w-lg mx-auto">{description}</h2>
        <p className="text-sm text-ink-muted max-w-md mx-auto">
          Fundação (API + design system) pronta. Módulo entrará na próxima leva junto ao PDV,
          Vendas, Relatórios e Auditoria.
        </p>
      </Card>
    </div>
  );
}
