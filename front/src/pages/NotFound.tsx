import { Link } from "react-router-dom";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";

export default function NotFoundPage() {
  return (
    <Card className="max-w-md mx-auto mt-16 text-center space-y-3">
      <h1 className="text-lg font-semibold text-ink">Página não encontrada</h1>
      <p className="text-sm text-ink-muted">O endereço acessado não existe.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </Card>
  );
}
