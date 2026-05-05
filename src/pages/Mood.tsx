import { useState } from "react";
import { trpc } from "../lib/trpc";
import { formatDate } from "../lib/utils";
import { Smile, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const MOODS = [
  { level: "1" as const, emoji: "😞", label: "Péssimo", color: "#ef4444", bg: "#fef2f2" },
  { level: "2" as const, emoji: "😕", label: "Ruim", color: "#f97316", bg: "#fff7ed" },
  { level: "3" as const, emoji: "😐", label: "Ok", color: "#eab308", bg: "#fefce8" },
  { level: "4" as const, emoji: "😊", label: "Bem", color: "#22c55e", bg: "#f0fdf4" },
  { level: "5" as const, emoji: "😄", label: "Ótimo", color: "#3b82f6", bg: "#eff6ff" },
];

export default function MoodPage() {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<"1"|"2"|"3"|"4"|"5"|null>(null);
  const [editing, setEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: today, isLoading } = trpc.mood.today.useQuery();
  const { data: history = [] } = trpc.mood.history.useQuery({ days: 30 });

  const upsert = trpc.mood.upsert.useMutation({
    onSuccess: () => {
      utils.mood.today.invalidate();
      utils.mood.history.invalidate();
      setEditing(false);
      setSelected(null);
      setNote("");
      toast.success("Humor registrado!");
    },
  });

  const del = trpc.mood.delete.useMutation({
    onSuccess: () => {
      utils.mood.today.invalidate();
      utils.mood.history.invalidate();
      toast.success("Registro removido");
    },
  });

  const currentMood = MOODS.find(m => m.level === today?.level);
  const showForm = !today || editing;

  function handleSubmit() {
    if (!selected) return toast.error("Selecione um humor");
    upsert.mutate({ level: selected, note: note || undefined });
  }

  function startEdit() {
    setSelected(today?.level ?? null);
    setNote(today?.note ?? "");
    setEditing(true);
  }

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Smile size={28} color="var(--primary)" /> Humor
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Como você está hoje?</p>
      </div>

      {/* Today's card */}
      <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Carregando...</div>
        ) : showForm ? (
          <>
            <p style={{ margin: "0 0 1.25rem", fontWeight: 600, fontSize: "0.95rem" }}>
              {editing ? "Atualizar humor de hoje" : "Como você está agora?"}
            </p>

            {/* Mood selector */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {MOODS.map(m => (
                <button
                  key={m.level}
                  onClick={() => setSelected(m.level)}
                  style={{
                    flex: 1, minWidth: 70,
                    padding: "1rem 0.5rem",
                    border: `2px solid ${selected === m.level ? m.color : "var(--border)"}`,
                    borderRadius: "0.875rem",
                    background: selected === m.level ? m.bg : "white",
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "1.75rem" }}>{m.emoji}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, color: selected === m.level ? m.color : "var(--text-muted)" }}>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Alguma observação? (opcional)"
              maxLength={500}
              style={{
                width: "100%", padding: "0.75rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem",
                fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", resize: "vertical", minHeight: 80,
                outline: "none", marginBottom: "1rem", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={upsert.isPending} style={{ flex: 1, justifyContent: "center" }}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </button>
              {editing && (
                <button className="btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: 72, height: 72, borderRadius: "1rem", background: currentMood?.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", flexShrink: 0 }}>
              {currentMood?.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 600, fontSize: "1.1rem" }}>
                Hoje você está <span style={{ color: currentMood?.color }}>{currentMood?.label}</span>
              </p>
              {today?.note && <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>{today.note}</p>}
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Registrado hoje</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn-ghost" onClick={startEdit} style={{ padding: "0.5rem" }} title="Editar">
                <Pencil size={16} />
              </button>
              <button className="btn-ghost" onClick={() => del.mutate({ id: today!.id })} style={{ padding: "0.5rem", color: "#ef4444", borderColor: "#fecaca" }} title="Remover">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: "0 0 1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Últimos 30 dias
          </h2>

          {/* Mini chart */}
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 60 }}>
              {history.slice(0, 30).reverse().map((entry, i) => {
                const mood = MOODS.find(m => m.level === entry.level);
                const h = (parseInt(entry.level) / 5) * 60;
                return (
                  <div key={i} title={`${entry.date}: ${mood?.label}`} style={{ flex: 1, height: h, background: mood?.color, borderRadius: "3px 3px 0 0", opacity: 0.8, minWidth: 4, transition: "opacity 0.15s" }} />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{history.length > 0 ? history[history.length - 1].date : ""}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Hoje</span>
            </div>
          </div>

          {/* List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {history.slice(0, 14).map(entry => {
              const mood = MOODS.find(m => m.level === entry.level);
              return (
                <div key={entry.id} className="card" style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{mood?.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500, color: mood?.color }}>{mood?.label}</span>
                    {entry.note && <p style={{ margin: "0.1rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>{entry.note}</p>}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDate(entry.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
