import { useAuth } from "../hooks/useAuth";
import { Smile, Moon, Droplets, Utensils, Film, Library } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const quickLinks = [
    { label: "Humor", icon: Smile, href: "/mood", color: "#22c55e", bg: "#f0fdf4" },
    { label: "Sono", icon: Moon, href: "/sleep", color: "#6366f1", bg: "#eef2ff" },
    { label: "Hidratação", icon: Droplets, href: "/hydration", color: "#0ea5e9", bg: "#f0f9ff" },
    { label: "Calorias", icon: Utensils, href: "/calories", color: "#f97316", bg: "#fff7ed" },
    { label: "Cultura", icon: Film, href: "/cultural", color: "#ec4899", bg: "#fdf2f8" },
    { label: "Leitura", icon: Library, href: "/book-club", color: "#d8871a", bg: "#fdf8ee" },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem" }}>
          Olá, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>
          {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        </p>
      </div>

      {/* Quick access */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: "0 0 1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Acesso rápido
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
          {quickLinks.map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1.5rem 1rem",
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                textDecoration: "none",
                color: "var(--text)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: "0.875rem", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.icon size={22} color={item.color} />
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Coming soon cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>Como você está hoje?</h3>
          <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>Registre seu humor diário</p>
          <a href="/mood" className="btn-primary" style={{ textDecoration: "none" }}>
            <Smile size={16} /> Registrar humor
          </a>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>Clube da Leitura</h3>
          <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>Veja o livro atual e registre seu progresso</p>
          <a href="/book-club" className="btn-primary" style={{ textDecoration: "none" }}>
            <Library size={16} /> Ver clube
          </a>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>Grupos Culturais</h3>
          <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>Filmes, música, teatro e muito mais</p>
          <a href="/cultural" className="btn-primary" style={{ textDecoration: "none" }}>
            <Film size={16} /> Explorar
          </a>
        </div>
      </div>
    </div>
  );
}
