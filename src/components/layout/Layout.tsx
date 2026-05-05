import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { trpc } from "../../lib/trpc";
import {
  LayoutDashboard, Smile, Moon, Droplets, Utensils, BookOpen,
  Users, Newspaper, Heart, Bell, BarChart2, Settings,
  ChefHat, Menu, X, LogOut, Film, Library
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Humor", icon: Smile, href: "/mood" },
  { label: "Sono", icon: Moon, href: "/sleep" },
  { label: "Hidratação", icon: Droplets, href: "/hydration" },
  { label: "Calorias", icon: Utensils, href: "/calories" },
  { label: "Receitas", icon: ChefHat, href: "/recipes" },
  { label: "Bem-Estar", icon: Heart, href: "/wellness" },
  { label: "Comunidade", icon: Newspaper, href: "/community" },
  { label: "Grupos Culturais", icon: Film, href: "/cultural" },
  { label: "Clube da Leitura", icon: Library, href: "/book-club" },
  { label: "Relatórios", icon: BarChart2, href: "/reports" },
];

const adminItems = [
  { label: "Administração", icon: Settings, href: "/admin" },
];

function NavItem({ item, currentPath }: { item: typeof navItems[0]; currentPath: string }) {
  const [, navigate] = useLocation();
  const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));

  return (
    <div className={`nav-item ${isActive ? "active" : ""}`} onClick={() => navigate(item.href)}>
      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      <span>{item.label}</span>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.href = "/login",
  });

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem 1rem" }}>
      {/* Logo */}
      <div style={{ marginBottom: "2rem", padding: "0 0.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 600, color: "var(--primary)", margin: 0 }}>
          Wellness
        </h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
          Seu espaço de bem-estar
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map(item => <NavItem key={item.href} item={item} currentPath={location} />)}

        {isAdmin && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "0.75rem 0.5rem" }} />
            {adminItems.map(item => <NavItem key={item.href} item={item} currentPath={location} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem" }}>
          {user?.image ? (
            <img src={user.image} alt={user.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 600, fontSize: "0.875rem" }}>
              {user?.name?.[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{isAdmin ? "Admin" : "Membro"}</p>
          </div>
          <button
            onClick={() => logout.mutate()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem", borderRadius: "0.5rem", display: "flex" }}
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: "260px",
        background: "white",
        borderRight: "1px solid var(--border)",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
      }}
        className="hidden md:flex"
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", zIndex: 50 }}
        className="flex md:hidden"
      >
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600, color: "var(--primary)", margin: 0 }}>Wellness</h1>
        <button onClick={() => setMobileOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", display: "flex" }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 45, display: "flex" }} className="md:hidden">
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ width: 260, background: "white", position: "relative", zIndex: 1, height: "100%" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 0, paddingTop: 0 }}
        className="md:ml-[260px]"
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}
          className="md:pt-8 pt-[72px]"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
