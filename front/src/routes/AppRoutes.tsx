import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/pages/Login";
import Verify2FAPage from "@/pages/Verify2FA";
import DashboardPage from "@/pages/Dashboard";
import ProfilePage from "@/pages/Profile";
import ProductsList from "@/pages/products/ProductsList";
import ProductForm from "@/pages/products/ProductForm";
import PdvPage from "@/pages/Pdv";
import SalesPage from "@/pages/Sales";
import UsersPage from "@/pages/Users";
import AuditPage from "@/pages/Audit";
import ReportsPage from "@/pages/Reports";
import StockEntryPage from "@/pages/StockEntry";
import CustomersPage from "@/pages/Customers";
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

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verificar-2fa" element={<Verify2FAPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/produtos" element={<Protected><ProductsList /></Protected>} />
      <Route path="/produtos/novo" element={<Protected><ProductForm /></Protected>} />
      <Route path="/produtos/:id/editar" element={<Protected><ProductForm /></Protected>} />
      <Route path="/estoque" element={<Protected><StockEntryPage /></Protected>} />
      <Route path="/clientes" element={<Protected><CustomersPage /></Protected>} />
      <Route path="/perfil" element={<Protected><ProfilePage /></Protected>} />
      <Route path="/pdv" element={<Protected><PdvPage /></Protected>} />
      <Route path="/vendas" element={<Protected><SalesPage /></Protected>} />
      <Route path="/relatorios" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/usuarios" element={<Protected><UsersPage /></Protected>} />
      <Route path="/auditoria" element={<Protected><AuditPage /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
