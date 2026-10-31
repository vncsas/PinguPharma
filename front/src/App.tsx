import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth-context";
import { UnitProvider } from "@/lib/unit-context";
import { queryClient } from "@/lib/query-client";
import { ToastProvider } from "@/design-system/components/Toast";
import { ConfirmProvider } from "@/design-system/components/ConfirmDialog";
import { AppRoutes } from "@/routes/AppRoutes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <UnitProvider>
                <AppRoutes />
              </UnitProvider>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
