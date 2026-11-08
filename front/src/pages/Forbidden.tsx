import { Link } from "react-router-dom";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";

export default function ForbiddenPage() {
  return (
    <Card className="max-w-md mx-auto mt-16 text-center space-y-3">
      <h1 className="text-lg font-semibold text-ink">Acesso negado</h1>
      <p className="text-sm text-ink-muted">Seu perfil não tem permissão para acessar esta tela.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </Card>
  );
}
