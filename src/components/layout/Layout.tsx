import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { trpc } from "../../lib/trpc";
import {
  LayoutDashboard, Smile, Moon, Droplets, Utensils,
  Users, Newspaper, Heart, Bell, BarChart2, Settings,
  ChefHat, Menu, X, LogOut, Film, Library
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", color: "#4CAF82" },
  { label: "Humor", icon: Smile, href: "/mood", color: "#F472B6" },
  { label: "Sono", icon: Moon, href: "/sleep", color: "#A78BFA" },
  { label: "Hidratação", icon: Droplets, href: "/hydration", color: "#60A5FA" },
  { label: "Calorias", icon: Utensils, href: "/calories", color: "#FB923C" },
  { label: "Receitas", icon: ChefHat, href: "/recipes", color: "#2DD4BF" },
  { label: "Bem-Estar", icon: Heart, href: "/wellness", color: "#F472B6" },
  { label: "Comunidade", icon: Newspaper, href: "/community", color: "#60A5FA" },
  { label: "Grupos Culturais", icon: Film, href: "/cultural", color: "#A78BFA" },
  { label: "Clube da Leitura", icon: Library, href: "/book-club", color: "#FB923C" },
  { label: "Relatórios", icon: BarChart2, href: "/reports", color: "#4CAF82" },
];

const adminItems = [
  { label: "Administração", icon: Settings, href: "/admin", color: "#64748b" },
];

function NavItem({ item, currentPath }: { item: typeof navItems[0]; currentPath: string }) {
  const [, navigate] = useLocation();
  const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));

  return (
    <div
      className={`nav-item ${isActive ? "active" : ""}`}
      onClick={() => navigate(item.href)}
      style={isActive ? { background: `${item.color}18`, color: item.color } : {}}
    >
      <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} color={isActive ? item.color : undefined} />
      <span>{item.label}</span>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.href = "/",
  });

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.25rem 0.875rem" }}>
      {/* Brand */}
      <div style={{ marginBottom: "1.75rem", padding: "0.5rem 0.5rem 1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "10px",
            background: "linear-gradient(135deg, #4CAF82, #2DD4BF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", flexShrink: 0,
          }}>🌿</div>
          <div>
            <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.1 }}>Wellness</p>
            <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.03em" }}>mente leve, vida plena</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        <p className="section-label" style={{ paddingLeft: "0.5rem" }}>Principal</p>
        {navItems.slice(0, 5).map(item => <NavItem key={item.href} item={item} currentPath={location} />)}

        <p className="section-label" style={{ paddingLeft: "0.5rem", marginTop: "1rem" }}>Saúde & Bem-Estar</p>
        {navItems.slice(5, 8).map(item => <NavItem key={item.href} item={item} currentPath={location} />)}

        <p className="section-label" style={{ paddingLeft: "0.5rem", marginTop: "1rem" }}>Cultura</p>
        {navItems.slice(8).map(item => <NavItem key={item.href} item={item} currentPath={location} />)}

        {isAdmin && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "0.75rem 0.25rem" }} />
            {adminItems.map(item => <NavItem key={item.href} item={item} currentPath={location} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.375rem" }}>
          {user?.image ? (
            <img src={user.image} alt={user.name} style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #4CAF82, #2DD4BF)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
              {user?.name?.[0]}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-muted)" }}>{isAdmin ? "Administrador" : "Membro"}</p>
          </div>
          <button onClick={() => logout.mutate()} title="Sair"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.375rem", borderRadius: "0.5rem", display: "flex", transition: "all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      <aside style={{ width: 252, background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)", position: "fixed", top: 0, left: 0, height: "100vh", overflowY: "auto", zIndex: 40, boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}
        className="hidden md:block">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 54, background: "white", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1rem", zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
        className="flex md:hidden">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: "8px", background: "linear-gradient(135deg, #4CAF82, #2DD4BF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🌿</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--text)" }}>Wellness</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", display: "flex", padding: "0.25rem" }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 45 }} className="md:hidden">
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ width: 252, background: "white", position: "relative", zIndex: 1, height: "100%", boxShadow: "4px 0 24px rgba(0,0,0,0.15)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="md:ml-[252px]" style={{ flex: 1 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "2rem 1.5rem" }} className="md:pt-8 pt-[70px]">
          {children}
        </div>
      </main>
    </div>
  );
}
