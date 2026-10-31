import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Badge } from "@/design-system/components/Badge";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Skeleton } from "@/design-system/components/Skeleton";
import { CsvButton } from "@/design-system/components/CsvButton";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { controlledApi } from "@/features/controlled/api";
import { productsApi } from "@/features/products/api";
import { MOVEMENT_LABEL } from "@/features/stock/api";
import { dateBR, dayBR, isoDate } from "@/lib/utils";

const TABS = [
  { key: "livro", label: "Livro" },
  { key: "balanco", label: "Balanço" },
];

export default function ControlledPage() {
  const [tab, setTab] = useState("livro");
  return (
    <div className="space-y-6">
      <Topbar title="Medicamentos controlados" tabs={TABS} activeTab={tab} onTabChange={setTab} />
      {tab === "livro" ? <LedgerTab /> : <BalanceTab />}
    </div>
  );
}

function LedgerTab() {
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState(isoDate(-29));
  const [to, setTo] = useState(isoDate(0));

  const products = useQuery({
    queryKey: ["products", "controlled-select"],
    queryFn: () => productsApi.list({ controlled: true, active: true, pageSize: 100 }),
  });
  const ledger = useQuery({
    queryKey: ["controlled", "ledger", productId, from, to],
    queryFn: () => controlledApi.ledger(productId, from, to),
    enabled: !!productId && !!from && !!to,
  });
  const l = ledger.data?.ledger;

  return (
    <>
      <Card className="flex flex-wrap items-end gap-3">
        <Field>
          <Label>Medicamento controlado</Label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="h-10 min-w-[240px] rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="">{products.isLoading ? "Carregando..." : "Selecione..."}</option>
            {(products.data?.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.controlledClass})</option>
            ))}
          </select>
        </Field>
        <Field>
          <Label>De</Label>
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field>
          <Label>Até</Label>
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <div className="ml-auto">
          <CsvButton
            path={controlledApi.ledgerCsvPath(productId, from, to)}
            filename={`livro-controlados-${from}-${to}.csv`}
            disabled={!productId}
          />
        </div>
      </Card>

      {products.isError && <p className="text-sm text-accent-rose">Não foi possível carregar os produtos controlados.</p>}

      {l && (
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-ink-muted">Saldo inicial: <strong className="text-ink">{l.openingBalance}</strong></span>
          <span className="text-ink-muted">Saldo final: <strong className="text-ink">{l.closingBalance}</strong></span>
          <Badge tone="danger">Classe {l.controlledClass}</Badge>
        </div>
      )}

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Tipo</Th>
              <Th>Unidade</Th>
              <Th>Lote</Th>
              <Th className="text-right">Qtd.</Th>
              <Th className="text-right">Saldo</Th>
              <Th>Receita / Prescritor</Th>
              <Th>Farmacêutico</Th>
              <Th>Paciente</Th>
            </tr>
          </thead>
          <tbody>
            {!productId ? (
              <Tr><Td colSpan={9} className="text-center text-ink-muted py-12">Selecione um medicamento para ver o livro.</Td></Tr>
            ) : ledger.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}><Td colSpan={9}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : ledger.isError ? (
              <Tr><Td colSpan={9} className="text-center text-accent-rose py-12">Não foi possível carregar o livro.</Td></Tr>
            ) : (l?.entries.length ?? 0) === 0 ? (
              <Tr><Td colSpan={9} className="text-center text-ink-muted py-12">Nenhuma movimentação no período.</Td></Tr>
            ) : (
              l!.entries.map((e) => (
                <Tr key={e.movementId}>
                  <Td className="whitespace-nowrap text-ink-muted">{dateBR(e.createdAt)}</Td>
                  <Td>{MOVEMENT_LABEL[e.type] ?? e.type}</Td>
                  <Td className="text-ink-muted">{e.unitName}</Td>
                  <Td className="text-ink-muted">{e.lotNumber ?? "—"}</Td>
                  <Td className={`text-right font-semibold ${e.quantity < 0 ? "text-accent-rose" : "text-accent-success"}`}>
                    {e.quantity > 0 ? `+${e.quantity}` : e.quantity}
                  </Td>
                  <Td className="text-right font-semibold">{e.balance}</Td>
                  <Td className="text-xs">
                    {e.prescriptionNumber || e.prescriberName ? (
                      <>
                        <p>{e.prescriptionNumber ? `Nº ${e.prescriptionNumber}` : "—"}</p>
                        <p className="text-ink-muted">
                          {e.prescriberName}
                          {e.prescriberCouncil ? ` · ${e.prescriberCouncil} ${e.prescriberCouncilNumber ?? ""}` : ""}
                        </p>
                      </>
                    ) : (
                      <span className="text-ink-muted">{e.reason ?? "—"}</span>
                    )}
                  </Td>
                  <Td>{e.pharmacistName ?? "—"}</Td>
                  <Td className="text-xs">
                    {e.patientName ? (
                      <>
                        <p>{e.patientName}</p>
                        <p className="text-ink-muted font-mono">{e.patientCpf ?? e.patientCns ?? ""}</p>
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>
    </>
  );
}

function BalanceTab() {
  const q = useQuery({ queryKey: ["controlled", "balance"], queryFn: controlledApi.balance });
  const rows = q.data?.rows ?? [];
  const divergent = rows.filter((r) => r.divergence !== 0).length;

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Compara o saldo dos lotes com o saldo do livro.{" "}
          {q.data && (divergent > 0 ? (
            <Badge tone="danger" dot>{divergent} com divergência</Badge>
          ) : (
            <Badge tone="success" dot>Sem divergências</Badge>
          ))}
        </p>
        <CsvButton path={controlledApi.balanceCsvPath()} filename="balanco-controlados.csv" />
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Medicamento</Th>
              <Th>Unidade</Th>
              <Th className="text-right">Saldo dos lotes</Th>
              <Th className="text-right">Saldo do livro</Th>
              <Th className="text-right">Divergência</Th>
              <Th>Lotes</Th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}><Td colSpan={6}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : q.isError ? (
              <Tr><Td colSpan={6} className="text-center text-accent-rose py-12">Não foi possível carregar o balanço.</Td></Tr>
            ) : rows.length === 0 ? (
              <Tr><Td colSpan={6} className="text-center text-ink-muted py-12">Nenhum medicamento controlado em estoque.</Td></Tr>
            ) : (
              rows.map((r) => (
                <Tr key={`${r.unitId}-${r.productId}`} className={r.divergence !== 0 ? "bg-accent-rose/5" : undefined}>
                  <Td>
                    <p className="font-medium">{r.productName}</p>
                    <p className="text-xs text-ink-muted">Classe {r.controlledClass}</p>
                  </Td>
                  <Td className="text-ink-muted">{r.unitName}</Td>
                  <Td className="text-right">{r.batchTotal}</Td>
                  <Td className="text-right">{r.ledgerTotal}</Td>
                  <Td className="text-right">
                    {r.divergence !== 0 ? <Badge tone="danger" dot>{r.divergence > 0 ? `+${r.divergence}` : r.divergence}</Badge> : <span className="text-ink-muted">0</span>}
                  </Td>
                  <Td className="text-xs text-ink-muted">
                    {r.batches.length === 0
                      ? "—"
                      : r.batches.map((b) => `${b.lotNumber} (${b.quantity}, val. ${dayBR(b.expiresAt)})`).join(" · ")}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>
    </>
  );
}
