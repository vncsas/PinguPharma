import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/design-system/ui/Button";
import { Card } from "@/design-system/ui/GlassCard";

interface State {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro ao renderizar a tela", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Card className="max-w-md mx-auto mt-16 text-center space-y-3">
        <h1 className="text-lg font-semibold text-ink">Algo deu errado</h1>
        <p className="text-sm text-ink-muted">
          Não foi possível carregar esta tela. Tente novamente ou volte ao início.
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            Tentar novamente
          </Button>
          <Button onClick={() => window.location.assign("/")}>Ir para o início</Button>
        </div>
      </Card>
    );
  }
}
