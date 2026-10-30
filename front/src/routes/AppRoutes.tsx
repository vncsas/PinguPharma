import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import NotFoundPage from "@/pages/NotFound";
import { privateRoutes, publicRoutes } from "./config";
import { RequireAuth, RequireRole } from "./guards";

const pageFallback = (
  <div className="min-h-screen grid place-items-center text-ink-muted">Carregando...</div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={pageFallback}>
      <Routes>
        {publicRoutes.map(({ path, component: Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}

        <Route element={<RequireAuth />}>
          {privateRoutes.map(({ path, component: Page, roles }) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireRole roles={roles}>
                  <Page />
                </RequireRole>
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
