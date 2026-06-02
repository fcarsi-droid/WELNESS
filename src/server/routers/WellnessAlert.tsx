import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Heart, X, ChevronRight, BookOpen, Lightbulb, Sparkles } from "lucide-react";

export function WellnessAlertPopup() {
  const [tab, setTab] = useState<"message"|"tip"|"reflection">("message");
  const { data: alert, isLoading } = trpc.wellnessAlert.checkAlert.useQuery();
  const dismiss = trpc.wellnessAlert.dismiss.useMutation();
  const utils = trpc.useUtils();

  if (isLoading || !alert?.show) return null;
  const alertData = alert as { show:true; consecutiveDays:number; negativePct:number; motivation:string; tip:string; reflection:string; };

  function handleDismiss() {
    dismiss.mutate();
    utils.wellnessAlert.checkAlert.invalidate();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "white", borderRadius: "1.5rem", maxWidth: 480, width: "100%",
        overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #7c3aed, #F472B6)", padding: "1.75rem 1.75rem 1.25rem", position: "relative" }}>
          <button onClick={handleDismiss}
            style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
            <X size={16}/>
          </button>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.875rem" }}>
            <Heart size={24} color="white"/>
          </div>
          <h2 style={{ margin: "0 0 0.5rem", color: "white", fontSize: "1.25rem", fontFamily: "'Playfair Display', serif" }}>
            Como você está?
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.85rem", lineHeight: 1.5 }}>
            Percebemos que você está passando por alguns dias mais difíceis.
            Isso é humano e faz parte da vida — mas queremos que você saiba que não precisa enfrentar isso sozinho(a).
          </p>
        </div>

        {/* Support message */}
        <div style={{ padding: "1.25rem 1.75rem", background: "#faf5ff", borderBottom: "1px solid #e9d5ff" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "#4a1d96" }}>
            A empresa disponibiliza uma <strong>psicóloga no ambulatório</strong>, além de <strong>massagem e acupuntura</strong> — recursos que podem ajudar. Mas se você não se sentir confortável com isso, buscar um <strong>profissional de saúde mental de sua confiança</strong> é igualmente válido e importante.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {[
            { key: "message", label: "Motivação", icon: Sparkles },
            { key: "tip", label: "Dica prática", icon: Lightbulb },
            { key: "reflection", label: "Reflexão", icon: BookOpen },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ flex: 1, padding: "0.75rem 0.5rem", border: "none", borderBottom: `2px solid ${tab === t.key ? "#7c3aed" : "transparent"}`, background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", color: tab === t.key ? "#7c3aed" : "var(--text-muted)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem", fontWeight: tab === t.key ? 700 : 500, transition: "all 0.15s" }}>
              <t.icon size={16}/>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem 1.75rem" }}>
          {tab === "message" && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "var(--text)", fontStyle: "italic", margin: "0 0 0.875rem" }}>
                "{alertData.motivation}"
              </p>
            </div>
          )}
          {tab === "tip" && (
            <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "0.75rem", background: "#fefce8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Lightbulb size={20} color="#ca8a04"/>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text)" }}>
                {alertData.tip}
              </p>
            </div>
          )}
          {tab === "reflection" && (
            <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
              <div style={{ width: 40, height: 40, borderRadius: "0.75rem", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookOpen size={20} color="#16a34a"/>
              </div>
              <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.7, color: "var(--text)" }}>
                {alertData.reflection}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 1.75rem 1.5rem", display: "flex", gap: "0.75rem" }}>
          <a href="/mood" onClick={handleDismiss}
            style={{ flex: 1, background: "linear-gradient(135deg, #7c3aed, #F472B6)", color: "white", border: "none", borderRadius: "0.875rem", padding: "0.75rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.875rem", textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
            Ver meu diário de humor <ChevronRight size={16}/>
          </a>
          <button onClick={handleDismiss}
            style={{ padding: "0.75rem 1.25rem", background: "var(--surface-2)", border: "none", borderRadius: "0.875rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
