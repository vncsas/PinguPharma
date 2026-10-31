import { MapPinned } from "lucide-react";
import { useUnit } from "@/lib/unit-context";

export function UnitRequiredNotice({ action = "registrar movimentações" }: { action?: string }) {
  const { needsUnit } = useUnit();
  if (!needsUnit) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-accent-amber/30 bg-accent-amber/15 px-4 py-3 text-sm text-[#7A5200]"
    >
      <MapPinned className="mt-0.5 size-4 shrink-0" />
      <p>
        Selecione uma unidade no seletor do topo da página para {action}. Com a opção "Todas as
        unidades" só é possível consultar.
      </p>
    </div>
  );
}
