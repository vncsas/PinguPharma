import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { useAuth } from "@/lib/auth-context";
import ForbiddenPage from "@/pages/Forbidden";
import { canAccess, type AppRoute } from "./config";

/** Layout route das telas autenticadas: redireciona para o login e monta o shell. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted">Carregando...</div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/** Bloqueia a tela quando o role do usuário não está na lista da rota. */
export function RequireRole({
  roles,
  children,
}: Pick<AppRoute, "roles"> & { children: ReactNode }) {
  const { user } = useAuth();
  return canAccess({ roles }, user?.role) ? <>{children}</> : <ForbiddenPage />;
}
