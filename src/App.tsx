import { useState } from "react";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./lib/trpc";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/layout/Layout";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MoodPage from "./pages/Mood";
import SleepPage from "./pages/Sleep";
import HydrationPage from "./pages/Hydration";
import CaloriesPage from "./pages/Calories";
import RecipesPage from "./pages/Recipes";
import WellnessPage from "./pages/Wellness";
import CommunityPage from "./pages/Community";
import CulturalPage from "./pages/Cultural";
import BookClubPage from "./pages/BookClub";
import AdminPage from "./pages/Admin";
import ReportsPage from "./pages/Reports";
import { Toaster } from "react-hot-toast";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const ComingSoon = ({ title }: { title: string }) => (
  <div style={{ textAlign:"center", padding:"4rem 2rem" }}>
    <p style={{ fontSize:"3rem", margin:"0 0 1rem" }}>🚧</p>
    <h2 style={{ margin:"0 0 0.5rem" }}>{title}</h2>
    <p style={{ color:"var(--text-muted)" }}>Em breve!</p>
    <a href="/" className="btn-primary" style={{ textDecoration:"none", marginTop:"1rem", display:"inline-flex" }}>← Voltar</a>
  </div>
);

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface)" }}>
        <div style={{ textAlign:"center" }}>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:"2rem", color:"var(--primary)", margin:"0 0 1rem" }}>Wellness</h1>
          <div style={{ width:32, height:32, border:"3px solid var(--border)", borderTopColor:"var(--primary)", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto" }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user || user.status !== "active") return <LoginPage/>;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/mood" component={MoodPage}/>
        <Route path="/sleep" component={SleepPage}/>
        <Route path="/hydration" component={HydrationPage}/>
        <Route path="/calories" component={CaloriesPage}/>
        <Route path="/recipes" component={RecipesPage}/>
        <Route path="/wellness" component={WellnessPage}/>
        <Route path="/community" component={CommunityPage}/>
        <Route path="/cultural" component={CulturalPage}/>
        <Route path="/book-club" component={BookClubPage}/>
        <Route path="/reports" component={ReportsPage}/>
        <Route path="/admin" component={AdminPage}/>
        <Route><ComingSoon title="Página não encontrada"/></Route>
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
          <AppRoutes/>
          <Toaster position="bottom-right" toastOptions={{ style: { fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem" } }}/>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
// v2.0.0
