import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { productsApi } from "@/features/products/api";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Input } from "@/design-system/components/Input";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { StatCard } from "@/design-system/components/StatCard";
import { Skeleton } from "@/design-system/components/Skeleton";
import { brl, dateBR } from "@/lib/utils";
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  PackagePlus,
  PackageSearch,
  Search,
  ShieldAlert,
} from "lucide-react";

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "ativos", label: "Ativos" },
  { key: "inativos", label: "Inativos" },
  { key: "baixo", label: "Baixo estoque" },
];

export default function ProductsList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("todos");

  const filters = {
    search,
    lowStockOnly: tab === "baixo",
    active: tab === "ativos" ? true : tab === "inativos" ? false : undefined,
    page,
    pageSize: 12,
  };
  const { data, isLoading } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => productsApi.list(filters),
  });

  const totals = useMemo(() => {
    if (!data) return { totalStock: 0, lowStock: 0, expiring: 0 };
    return data.data.reduce(
      (acc, p) => {
        acc.totalStock += p.totalStock;
        if (p.totalStock <= p.minStockAlert) acc.lowStock++;
        if (
          p.nearestExpiration &&
          new Date(p.nearestExpiration).getTime() - Date.now() < 30 * 24 * 3600 * 1000
        )
          acc.expiring++;
        return acc;
      },
      { totalStock: 0, lowStock: 0, expiring: 0 },
    );
  }, [data]);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <Topbar
        title="Produtos"
        tabs={TABS}
        activeTab={tab}
        onTabChange={(k) => {
          setTab(k);
          setPage(1);
        }}
        actions={
          <Button size="sm" asChild>
            <Link to="/produtos/novo">
              <PackagePlus className="size-4" /> Novo produto
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Itens no catálogo"
          value={data ? String(data.total) : "—"}
          delta="Portfólio total"
          icon={<Boxes className="size-4" />}
        />
        <StatCard
          label="Unidades listadas"
          value={String(totals.totalStock)}
          delta="Somatório de lotes"
          icon={<PackageSearch className="size-4" />}
        />
        <StatCard
          label="Alertas de estoque"
          value={String(totals.lowStock)}
          delta="Ação recomendada"
          deltaTone="down"
          icon={<ShieldAlert className="size-4" />}
        />
        <StatCard
          label="Vencendo em 30d"
          value={String(totals.expiring)}
          delta="Verificar lotes"
          deltaTone="down"
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      <Card padded={false} className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por nome ou SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<Search className="size-4" />}
            />
          </div>
        </div>
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>SKU</Th>
              <Th className="text-right">Preço</Th>
              <Th className="text-right">Estoque</Th>
              <Th>Próx. validade</Th>
              <Th>Status</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}>
                  <Td colSpan={7}><Skeleton className="h-4" /></Td>
                </Tr>
              ))
            ) : data && data.data.length > 0 ? (
              data.data.map((p) => {
                const low = p.totalStock <= p.minStockAlert;
                return (
                  <Tr key={p.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
                          <Boxes className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-ink">{p.name}</p>
                          <p className="text-xs text-ink-muted">
                            {p.batchCount} lote{p.batchCount === 1 ? "" : "s"} · mín. {p.minStockAlert}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs text-ink-muted">{p.sku}</Td>
                    <Td className="text-right font-medium">{brl(p.price)}</Td>
                    <Td className="text-right">
                      <span className={low ? "text-accent-rose font-semibold" : "font-medium"}>
                        {p.totalStock}
                      </span>
                    </Td>
                    <Td>
                      {p.nearestExpiration ? (
                        <span className="text-sm text-ink-muted">{dateBR(p.nearestExpiration)}</span>
                      ) : (
                        <span className="text-ink-subtle text-sm">—</span>
                      )}
                    </Td>
                    <Td>
                      {!p.active ? (
                        <Badge>Inativo</Badge>
                      ) : low ? (
                        <Badge tone="danger" dot>Baixo estoque</Badge>
                      ) : (
                        <Badge tone="success" dot>Saudável</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Button asChild variant="link" size="sm">
                        <Link to={`/produtos/${p.id}/editar`}>
                          Editar <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={7} className="text-center text-ink-muted py-12">
                  Nenhum produto encontrado com os filtros atuais.
                </Td>
              </Tr>
            )}
          </tbody>
        </Table>
      </TableShell>

      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Página {data?.page ?? 1} de {pageCount}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
