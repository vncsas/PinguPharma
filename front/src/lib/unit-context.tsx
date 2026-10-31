import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unitStore } from "./api-client";
import { useAuth } from "./auth-context";
import { useUnits, type UnitDTO } from "@/features/units/api";

interface UnitContextValue {
  isAdmin: boolean;
  units: UnitDTO[];
  /** ADMIN: unidade escolhida (null = todas). */
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
  /** Unidade em uso: a escolhida pelo ADMIN ou a própria do usuário. */
  currentUnit: UnitDTO | null;
  /** ADMIN sem unidade escolhida: telas de escrita devem avisar. */
  needsUnit: boolean;
}

const Ctx = createContext<UnitContextValue | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [selected, setSelected] = useState<string | null>(() => unitStore.get());
  const unitsQuery = useUnits({}, !!user);
  const units = useMemo(() => unitsQuery.data?.units ?? [], [unitsQuery.data]);

  const setSelectedUnitId = useCallback(
    (id: string | null) => {
      unitStore.set(id);
      setSelected(id);
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "units" });
    },
    [qc],
  );

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && unitStore.get()) {
      unitStore.set(null);
      setSelected(null);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin && selected && unitsQuery.data && !units.some((u) => u.id === selected)) {
      unitStore.set(null);
      setSelected(null);
    }
  }, [isAdmin, selected, units, unitsQuery.data]);

  const selectedUnitId = isAdmin ? selected : null;
  const currentUnit = isAdmin
    ? (units.find((u) => u.id === selectedUnitId) ?? null)
    : (units.find((u) => u.id === user?.unitId) ?? units[0] ?? null);

  return (
    <Ctx.Provider
      value={{
        isAdmin,
        units,
        selectedUnitId,
        setSelectedUnitId,
        currentUnit,
        needsUnit: isAdmin && !selectedUnitId,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useUnit() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUnit deve ser usado dentro de <UnitProvider>");
  return ctx;
}
