import { Bullet } from "@/design-system/ui/Bullet";
import { Card } from "@/design-system/ui/GlassCard";

export function StockRulesCard() {
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-ink">Cheat-sheet</h2>
        <p className="text-xs text-ink-muted">Como funciona a baixa por lote</p>
      </div>
      <ul className="space-y-3 text-sm text-ink-muted">
        <Bullet>
          <strong>PDV consome pelo FIFO</strong> — sempre o lote com validade mais próxima sai
          primeiro.
        </Bullet>
        <Bullet>
          Cancelar venda <strong>estorna a quantidade</strong> exata dos lotes originais.
        </Bullet>
        <Bullet>
          Lotes com quantidade 0 podem ser removidos manualmente. Com estoque, não podem.
        </Bullet>
        <Bullet>
          Alertas de validade rodam <strong>por lote com quantidade &gt; 0</strong> em até 30 dias.
        </Bullet>
      </ul>
    </Card>
  );
}
