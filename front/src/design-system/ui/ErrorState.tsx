import { CircleAlert } from "lucide-react";
import { errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/** Estado de falha de uma query: mensagem da API e botão para tentar de novo. */
export function ErrorState({
  error,
  title = "Não foi possível carregar os dados",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-2 py-8 text-center", className)}>
      <CircleAlert className="size-5 text-accent-rose" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {error !== undefined && <p className="text-xs text-ink-muted">{errorMessage(error, "")}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
