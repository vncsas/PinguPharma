import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { downloadCsv } from "@/features/reports/api";
import { errMsg } from "@/lib/utils";

export function CsvButton({ path, filename, disabled }: { path: string; filename: string; disabled?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadCsv(path, filename);
        } catch (err) {
          toast.error("Falha ao exportar", errMsg(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download className="size-4" /> {busy ? "Exportando..." : "Exportar CSV"}
    </Button>
  );
}
