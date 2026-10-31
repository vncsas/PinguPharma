import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Badge } from "@/design-system/components/Badge";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { CsvButton } from "@/design-system/components/CsvButton";
import {
  reportsApi,
  type CoverageStatus,
  type DispensationGroupBy,
} from "@/features/reports/api";
import { MOVEMENT_LABEL } from "@/features/stock/api";
import { brl, dateBR, isoDate } from "@/lib/utils";

const TABS = [
  { key: "consumo", label: "Consumo" },
  { key: "cobertura", label: "Cobertura de estoque" },
  { key: "perdas", label: "Perdas" },
  { key: "dispensacoes", label: "Dispensações" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState("consumo");
  return (
    <div className="space-y-6">
      <Topbar title="Relatórios" tabs={TABS} activeTab={tab} onTabChange={setTab} />
      {tab === "consumo" && <ConsumptionTab />}
      {tab === "cobertura" && <CoverageTab />}
      {tab === "perdas" && <LossesTab />}
      {tab === "dispensacoes" && <DispensationsTab />}
    </div>
  );
}

function usePeriod() {
  const [from, setFrom] = useState(isoDate(-29));
  const [to, setTo] = useState(isoDate(0));
  return { from, to, setFrom, setTo };
}

function Filters({
  period,
  children,
  csv,
}: {
  period?: ReturnType<typeof usePeriod>;
  children?: ReactNode;
  csv: ReactNode;
}) {
  return (
    <Card className="flex flex-wrap items-end gap-3">
      {period && (
        <>
          <Field>
            <Label>De</Label>
            <Input type="date" value={period.from} max={period.to} onChange={(e) => period.setFrom(e.target.value)} />
          </Field>
          <Field>
            <Label>Até</Label>
            <Input type="date" value={period.to} min={period.from} onChange={(e) => period.setTo(e.target.value)} />
          </Field>
        </>
      )}
      {children}
      <div className="ml-auto">{csv}</div>
    </Card>
  );
}

function Body({
  cols,
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  cols: number;
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading)
    return <>{Array.from({ length: 5 }).map((_, i) => (
      <Tr key={i}><Td colSpan={cols}><Skeleton className="h-4" /></Td></Tr>
    ))}</>;
  if (error)
    return <Tr><Td colSpan={cols} className="text-center text-accent-rose py-12">Não foi possível carregar o relatório.</Td></Tr>;
  if (empty)
    return <Tr><Td colSpan={cols} className="text-center text-ink-muted py-12">{emptyText}</Td></Tr>;
  return <>{children}</>;
}

// ---------- Consumo ----------

function ConsumptionTab() {
  const p = usePeriod();
  const q = useQuery({
    queryKey: ["reports", "consumption", p.from, p.to],
    queryFn: () => reportsApi.consumption(p.from, p.to),
    enabled: !!p.from && !!p.to,
  });
  const rows = [...(q.data?.rows ?? [])].sort((a, b) => b.quantity - a.quantity);

  return (
    <>
      <Filters
        period={p}
        csv={<CsvButton path={reportsApi.consumptionCsvPath(p.from, p.to)} filename={`consumo-${p.from}-${p.to}.csv`} />}
      />
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>Unidade</Th>
              <Th className="text-right">Quantidade dispensada</Th>
              <Th className="text-right">Dispensações</Th>
              <Th className="text-right">Valor de referência</Th>
            </tr>
          </thead>
          <tbody>
            <Body cols={5} loading={q.isLoading} error={q.isError} empty={rows.length === 0} emptyText="Nenhuma dispensação no período.">
              {rows.map((r) => (
                <Tr key={`${r.unitId}-${r.productId}`}>
                  <Td>
                    <p className="text-sm font-medium">{r.productName}</p>
                    <p className="text-xs text-ink-muted font-mono">{r.productSku}</p>
                  </Td>
                  <Td className="text-ink-muted">{r.unitName}</Td>
                  <Td className="text-right font-semibold">{r.quantity}</Td>
                  <Td className="text-right">{r.dispensationCount}</Td>
                  <Td className="text-right text-ink-muted">{brl(r.totalValue)}</Td>
                </Tr>
              ))}
            </Body>
          </tbody>
        </Table>
      </TableShell>
    </>
  );
}

// ---------- Cobertura ----------

const COVERAGE_META: Record<CoverageStatus, { label: string; tone: "danger" | "orange" | "warn" | "success" }> = {
  RUPTURE: { label: "Ruptura", tone: "danger" },
  CRITICAL: { label: "Crítico", tone: "orange" },
  LOW: { label: "Baixo", tone: "warn" },
  OK: { label: "Adequado", tone: "success" },
};

function CoverageTab() {
  const q = useQuery({ queryKey: ["reports", "coverage"], queryFn: () => reportsApi.stockCoverage() });
  const rows = q.data?.rows ?? [];

  return (
    <>
      <Filters csv={<CsvButton path={reportsApi.stockCoverageCsvPath()} filename="cobertura-estoque.csv" />}>
        <p className="text-xs text-ink-muted max-w-md">
          Cobertura = estoque atual ÷ consumo médio diário dos últimos 30 dias. Crítico: até 7 dias.
        </p>
      </Filters>
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>Unidade</Th>
              <Th className="text-right">Estoque</Th>
              <Th className="text-right">Mínimo</Th>
              <Th className="text-right">Consumo/dia</Th>
              <Th className="text-right">Cobertura</Th>
              <Th>Situação</Th>
            </tr>
          </thead>
          <tbody>
            <Body cols={7} loading={q.isLoading} error={q.isError} empty={rows.length === 0} emptyText="Nenhum produto para analisar.">
              {rows.map((r) => {
                const meta = COVERAGE_META[r.status];
                const hot = r.status === "RUPTURE" || r.status === "CRITICAL";
                return (
                  <Tr key={`${r.unitId}-${r.productId}`} className={hot ? "bg-accent-rose/5" : undefined}>
                    <Td>
                      <p className="text-sm font-medium">{r.productName}</p>
                      <p className="text-xs text-ink-muted font-mono">{r.productSku}</p>
                    </Td>
                    <Td className="text-ink-muted">{r.unitName}</Td>
                    <Td className="text-right font-semibold">{r.currentStock}</Td>
                    <Td className="text-right text-ink-muted">{r.minStockAlert}</Td>
                    <Td className="text-right">{r.avgDailyConsumption.toFixed(1)}</Td>
                    <Td className="text-right">{r.coverageDays === null ? "—" : `${Math.floor(r.coverageDays)} dias`}</Td>
                    <Td><Badge tone={meta.tone} dot>{meta.label}</Badge></Td>
                  </Tr>
                );
              })}
            </Body>
          </tbody>
        </Table>
      </TableShell>
    </>
  );
}

// ---------- Perdas ----------

function LossesTab() {
  const p = usePeriod();
  const q = useQuery({
    queryKey: ["reports", "losses", p.from, p.to],
    queryFn: () => reportsApi.losses(p.from, p.to),
    enabled: !!p.from && !!p.to,
  });
  const report = q.data?.report;
  const rows = report?.rows ?? [];

  return (
    <>
      <Filters
        period={p}
        csv={<CsvButton path={reportsApi.lossesCsvPath(p.from, p.to)} filename={`perdas-${p.from}-${p.to}.csv`} />}
      />
      {report && (
        <div className="flex flex-wrap gap-6 text-sm text-ink-muted">
          <span>Total de unidades perdidas: <strong className="text-ink">{report.totalQuantity}</strong></span>
          <span>Valor: <strong className="text-ink">{brl(report.totalValue)}</strong></span>
          {report.byType.map((t) => (
            <span key={t.type}>
              {MOVEMENT_LABEL[t.type as keyof typeof MOVEMENT_LABEL] ?? t.type}: <strong className="text-ink">{t.quantity}</strong>
            </span>
          ))}
        </div>
      )}
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Produto</Th>
              <Th>Unidade</Th>
              <Th>Lote</Th>
              <Th>Tipo</Th>
              <Th className="text-right">Qtd.</Th>
              <Th className="text-right">Valor</Th>
              <Th>Motivo</Th>
              <Th>Responsável</Th>
            </tr>
          </thead>
          <tbody>
            <Body cols={9} loading={q.isLoading} error={q.isError} empty={rows.length === 0} emptyText="Nenhuma perda registrada no período.">
              {rows.map((r) => (
                <Tr key={r.movementId}>
                  <Td className="whitespace-nowrap text-ink-muted">{dateBR(r.createdAt)}</Td>
                  <Td className="font-medium">{r.productName}</Td>
                  <Td className="text-ink-muted">{r.unitName}</Td>
                  <Td className="text-ink-muted">{r.lotNumber ?? "—"}</Td>
                  <Td>
                    <Badge tone={r.type === "LOSS_EXPIRED" ? "warn" : "danger"}>
                      {r.type === "LOSS_EXPIRED" ? "Vencimento" : "Avaria"}
                    </Badge>
                  </Td>
                  <Td className="text-right font-semibold">{Math.abs(r.quantity)}</Td>
                  <Td className="text-right text-ink-muted">{brl(r.value)}</Td>
                  <Td className="text-xs text-ink-muted max-w-xs truncate">{r.reason ?? "—"}</Td>
                  <Td>{r.userName}</Td>
                </Tr>
              ))}
            </Body>
          </tbody>
        </Table>
      </TableShell>
    </>
  );
}

// ---------- Dispensações ----------

function DispensationsTab() {
  const p = usePeriod();
  const [groupBy, setGroupBy] = useState<DispensationGroupBy>("patient");
  const q = useQuery({
    queryKey: ["reports", "dispensations", groupBy, p.from, p.to],
    queryFn: () => reportsApi.dispensations(groupBy, p.from, p.to),
    enabled: !!p.from && !!p.to,
  });
  const rows = q.data?.rows ?? [];

  return (
    <>
      <Filters
        period={p}
        csv={
          <CsvButton
            path={reportsApi.dispensationsCsvPath(groupBy, p.from, p.to)}
            filename={`dispensacoes-${groupBy === "patient" ? "paciente" : "prescritor"}-${p.from}-${p.to}.csv`}
          />
        }
      >
        <Field>
          <Label>Agrupar por</Label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as DispensationGroupBy)}
            className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="patient">Paciente</option>
            <option value="prescriber">Prescritor</option>
          </select>
        </Field>
      </Filters>
      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>{groupBy === "patient" ? "Paciente" : "Prescritor"}</Th>
              <Th className="text-right">Dispensações</Th>
              <Th className="text-right">Itens</Th>
              <Th className="text-right">Valor de referência</Th>
            </tr>
          </thead>
          <tbody>
            <Body cols={4} loading={q.isLoading} error={q.isError} empty={rows.length === 0} emptyText="Nenhuma dispensação no período.">
              {rows.map((r) => (
                <Tr key={r.key}>
                  <Td className="font-medium">{r.label}</Td>
                  <Td className="text-right">{r.dispensationCount}</Td>
                  <Td className="text-right font-semibold">{r.itemQuantity}</Td>
                  <Td className="text-right text-ink-muted">{brl(r.totalValue)}</Td>
                </Tr>
              ))}
            </Body>
          </tbody>
        </Table>
      </TableShell>
    </>
  );
}
