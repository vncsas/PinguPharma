import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Search } from "lucide-react";
import { Topbar } from "@/design-system/components/Topbar";
import { Card } from "@/design-system/components/GlassCard";
import { Button } from "@/design-system/components/Button";
import { Field, Input, Label } from "@/design-system/components/Input";
import { Modal } from "@/design-system/components/Modal";
import { Badge } from "@/design-system/components/Badge";
import { Table, TableShell, Td, Th, Tr } from "@/design-system/components/Table";
import { Skeleton } from "@/design-system/components/Skeleton";
import { useToast } from "@/design-system/components/Toast";
import {
  UNIT_TYPE_LABEL,
  unitsApi,
  useUnits,
  type UnitDTO,
  type UnitType,
} from "@/features/units/api";
import { errMsg } from "@/lib/utils";

const TYPES = Object.keys(UNIT_TYPE_LABEL) as UnitType[];

export default function UnitsPage() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UnitDTO | null>(null);
  const list = useUnits({ search: search || undefined });
  const units = list.data?.units ?? [];

  return (
    <div className="space-y-6">
      <Topbar
        title="Unidades"
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Nova unidade
          </Button>
        }
      />

      <Card>
        <Input
          leadingIcon={<Search className="size-4" />}
          placeholder="Buscar por nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <TableShell>
        <Table>
          <thead>
            <tr>
              <Th>Unidade</Th>
              <Th>Tipo</Th>
              <Th>CNES</Th>
              <Th>Situação</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}><Td colSpan={5}><Skeleton className="h-4" /></Td></Tr>
              ))
            ) : list.isError ? (
              <Tr><Td colSpan={5} className="text-center text-accent-rose py-12">Não foi possível carregar as unidades.</Td></Tr>
            ) : units.length === 0 ? (
              <Tr><Td colSpan={5} className="text-center text-ink-muted py-12">Nenhuma unidade cadastrada.</Td></Tr>
            ) : (
              units.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-brand-50 text-brand-600 grid place-items-center">
                        <Building2 className="size-4" />
                      </div>
                      <p className="font-medium">{u.name}</p>
                    </div>
                  </Td>
                  <Td>{UNIT_TYPE_LABEL[u.type]}</Td>
                  <Td className="font-mono text-xs text-ink-muted">{u.cnes ?? "—"}</Td>
                  <Td>
                    <Badge tone={u.active ? "success" : "neutral"} dot>{u.active ? "Ativa" : "Inativa"}</Badge>
                  </Td>
                  <Td className="text-right">
                    <button onClick={() => setEditing(u)} className="text-xs font-medium text-brand-500 hover:underline">
                      Editar
                    </button>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

      {creating && <UnitModal onClose={() => setCreating(false)} />}
      {editing && <UnitModal initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UnitModal({ initial, onClose }: { initial?: UnitDTO; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [cnes, setCnes] = useState(initial?.cnes ?? "");
  const [type, setType] = useState<UnitType>(initial?.type ?? "UBS");
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const data = { name: name.trim(), cnes: cnes.trim() || null, type, active };
      return initial ? unitsApi.update(initial.id, data) : unitsApi.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      toast.success(initial ? "Unidade atualizada" : "Unidade cadastrada");
      onClose();
    },
    onError: (err) => setError(errMsg(err)),
  });

  return (
    <Modal title={initial ? `Editar ${initial.name}` : "Nova unidade"} onClose={onClose}>
      <Field>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <Label>Tipo</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as UnitType)}
            className="h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{UNIT_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </Field>
        <Field>
          <Label>CNES</Label>
          <Input value={cnes} onChange={(e) => setCnes(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-brand-500" />
        Unidade ativa
      </label>
      {error && <p className="text-sm text-accent-rose">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => {
            setError(null);
            mut.mutate();
          }}
          disabled={mut.isPending || name.trim().length < 2}
        >
          {mut.isPending ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </Modal>
  );
}
