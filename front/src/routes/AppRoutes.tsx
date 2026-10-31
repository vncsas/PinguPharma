import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/pages/Login";
import Verify2FAPage from "@/pages/Verify2FA";
import DashboardPage from "@/pages/Dashboard";
import ProfilePage from "@/pages/Profile";
import ProductsList from "@/pages/products/ProductsList";
import ProductForm from "@/pages/products/ProductForm";
import DispensationPage from "@/pages/Dispensation";
import DispensationsPage from "@/pages/Dispensations";
import UsersPage from "@/pages/Users";
import AuditPage from "@/pages/Audit";
import ReportsPage from "@/pages/Reports";
import StockEntryPage from "@/pages/StockEntry";
import PatientsPage from "@/pages/Patients";
import PrescriptionsPage from "@/pages/Prescriptions";
import SuppliersPage from "@/pages/Suppliers";
import UnitsPage from "@/pages/Units";
import TransfersPage from "@/pages/Transfers";
import ControlledPage from "@/pages/Controlled";
import NotificationsPage from "@/pages/Notifications";
import { ForgotPasswordPage, ResetPasswordPage } from "@/pages/ForgotPassword";
import { Sidebar } from "@/design-system/components/Sidebar";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-surface-canvas">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

type Role = NonNullable<ReturnType<typeof useAuth>["user"]>["role"];

function Protected({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
}

// Espelha os guards do back: estoque/relatórios = ADMIN|MANAGER|PHARMACIST; fornecedores = ADMIN|MANAGER.
const STAFF: Role[] = ["ADMIN", "MANAGER", "PHARMACIST"];
const MANAGER_UP: Role[] = ["ADMIN", "MANAGER"];
const ADMIN_ONLY: Role[] = ["ADMIN"];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verificar-2fa" element={<Verify2FAPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/dispensacao" element={<Protected><DispensationPage /></Protected>} />
      <Route path="/pacientes" element={<Protected><PatientsPage /></Protected>} />
      <Route path="/receitas" element={<Protected><PrescriptionsPage /></Protected>} />
      <Route path="/produtos" element={<Protected roles={STAFF}><ProductsList /></Protected>} />
      <Route path="/produtos/novo" element={<Protected roles={MANAGER_UP}><ProductForm /></Protected>} />
      <Route path="/produtos/:id/editar" element={<Protected roles={MANAGER_UP}><ProductForm /></Protected>} />
      <Route path="/estoque" element={<Protected roles={STAFF}><StockEntryPage /></Protected>} />
      <Route path="/dispensacoes" element={<Protected roles={STAFF}><DispensationsPage /></Protected>} />
      <Route path="/transferencias" element={<Protected roles={STAFF}><TransfersPage /></Protected>} />
      <Route path="/controlados" element={<Protected roles={STAFF}><ControlledPage /></Protected>} />
      <Route path="/fornecedores" element={<Protected roles={MANAGER_UP}><SuppliersPage /></Protected>} />
      <Route path="/relatorios" element={<Protected roles={STAFF}><ReportsPage /></Protected>} />
      <Route path="/notificacoes" element={<Protected><NotificationsPage /></Protected>} />
      <Route path="/perfil" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/unidades" element={<Protected roles={ADMIN_ONLY}><UnitsPage /></Protected>} />
      <Route path="/usuarios" element={<Protected roles={ADMIN_ONLY}><UsersPage /></Protected>} />
      <Route path="/auditoria" element={<Protected roles={ADMIN_ONLY}><AuditPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
