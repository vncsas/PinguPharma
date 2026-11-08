import { lazy, type ComponentType } from "react";
import {
  BarChart3,
  Boxes,
  History,
  LayoutDashboard,
  Package,
  ShieldAlert,
  ShoppingBag,
  UserSquare2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/features/auth/types";

export interface AppRoute {
  path: string;
  component: ComponentType;
  /** Roles com acesso. Sem a propriedade, qualquer usuário autenticado acessa. */
  roles?: readonly Role[];
  /** Presente quando a rota aparece no menu lateral. */
  nav?: { label: string; icon: LucideIcon };
}

const ALL: readonly Role[] = ["ADMIN", "MANAGER", "SELLER"];
const MANAGERS: readonly Role[] = ["ADMIN", "MANAGER"];
const ADMIN_ONLY: readonly Role[] = ["ADMIN"];

/** Rotas abertas (sem autenticação). */
export const publicRoutes: Pick<AppRoute, "path" | "component">[] = [
  { path: "/login", component: lazy(() => import("@/features/auth/pages/Login")) },
  { path: "/verificar-2fa", component: lazy(() => import("@/features/auth/pages/Verify2FA")) },
  {
    path: "/esqueci-senha",
    component: lazy(() =>
      import("@/features/auth/pages/ForgotPassword").then((m) => ({ default: m.ForgotPasswordPage })),
    ),
  },
  {
    path: "/redefinir-senha",
    component: lazy(() =>
      import("@/features/auth/pages/ForgotPassword").then((m) => ({ default: m.ResetPasswordPage })),
    ),
  },
];

/** Rotas autenticadas. A ordem define a ordem do menu lateral. */
export const privateRoutes: AppRoute[] = [
  {
    path: "/",
    component: lazy(() => import("@/features/dashboard/pages/Dashboard")),
    roles: ALL,
    nav: { label: "Dashboard", icon: LayoutDashboard },
  },
  {
    path: "/pdv",
    component: lazy(() => import("@/features/sales/pages/Pdv")),
    roles: ALL,
    nav: { label: "PDV", icon: ShoppingBag },
  },
  {
    path: "/produtos",
    component: lazy(() => import("@/features/products/pages/ProductsList")),
    roles: MANAGERS,
    nav: { label: "Produtos", icon: Package },
  },
  {
    path: "/produtos/novo",
    component: lazy(() => import("@/features/products/pages/ProductForm")),
    roles: MANAGERS,
  },
  {
    path: "/produtos/:id/editar",
    component: lazy(() => import("@/features/products/pages/ProductForm")),
    roles: MANAGERS,
  },
  {
    path: "/estoque",
    component: lazy(() => import("@/features/batches/pages/StockEntry")),
    roles: MANAGERS,
    nav: { label: "Estoque", icon: Boxes },
  },
  {
    path: "/vendas",
    component: lazy(() => import("@/features/sales/pages/Sales")),
    roles: MANAGERS,
    nav: { label: "Vendas", icon: History },
  },
  {
    path: "/clientes",
    component: lazy(() => import("@/features/customers/pages/Customers")),
    roles: MANAGERS,
    nav: { label: "Clientes", icon: UserSquare2 },
  },
  {
    path: "/relatorios",
    component: lazy(() => import("@/features/reports/pages/Reports")),
    roles: MANAGERS,
    nav: { label: "Relatórios", icon: BarChart3 },
  },
  {
    path: "/usuarios",
    component: lazy(() => import("@/features/users/pages/Users")),
    roles: ADMIN_ONLY,
    nav: { label: "Usuários", icon: Users },
  },
  {
    path: "/auditoria",
    component: lazy(() => import("@/features/audit/pages/Audit")),
    roles: ADMIN_ONLY,
    nav: { label: "Auditoria", icon: ShieldAlert },
  },
  { path: "/perfil", component: lazy(() => import("@/features/auth/pages/Profile")), roles: ALL },
];

export function canAccess(route: Pick<AppRoute, "roles">, role: Role | undefined) {
  if (!route.roles) return true;
  return role !== undefined && route.roles.includes(role);
}

/** Itens do menu lateral visíveis para o role informado. */
export function navItemsFor(role: Role | undefined) {
  return privateRoutes
    .filter((r): r is AppRoute & Required<Pick<AppRoute, "nav">> => !!r.nav && canAccess(r, role))
    .map((r) => ({ to: r.path, ...r.nav }));
}
