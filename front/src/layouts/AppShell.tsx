import { Suspense, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/design-system/layout/Sidebar";
import { Skeleton } from "@/design-system/ui/Skeleton";
import { RouteErrorBoundary } from "@/routes/RouteErrorBoundary";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex bg-surface-canvas">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto p-6">
          {/* key: ao trocar de rota o boundary é recriado e sai do estado de erro */}
          <RouteErrorBoundary key={pathname}>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>{children}</Suspense>
          </RouteErrorBoundary>
        </div>
      </main>
    </div>
  );
}
