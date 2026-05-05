import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./lib/trpc";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/layout/Layout";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "var(--primary)", margin: "0 0 1rem" }}>Wellness</h1>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user || user.status !== "active") {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route>
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <h2>Página em construção 🚧</h2>
            <p style={{ color: "var(--text-muted)" }}>Este módulo está sendo desenvolvido.</p>
            <a href="/" className="btn-primary" style={{ textDecoration: "none", marginTop: "1rem", display: "inline-flex" }}>← Voltar ao início</a>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

export default function App() {
  const [qc] = useState(() => queryClient);
  return (
    <trpc.Provider client={trpcClient} queryClient={qc}>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
