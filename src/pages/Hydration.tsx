import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Droplets, Plus, Minus, Settings } from "lucide-react";
import toast from "react-hot-toast";

export default function HydrationPage() {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("8");

  const utils = trpc.useUtils();
  const { data: today = { glasses: 0, goalGlasses: 8 }, isLoading } = trpc.hydration.today.useQuery();
  const { data: history = [] } = trpc.hydration.history.useQuery({ days: 7 });

  const update = trpc.hydration.update.useMutation({
    onSuccess: () => utils.hydration.today.invalidate(),
  });

  function add(n: number) {
    const newVal = Math.max(0, today.glasses + n);
    update.mutate({ glasses: newVal });
    if (n > 0 && newVal === today.goalGlasses) toast.success("🎉 Meta atingida!");
  }

  function saveGoal() {
    const g = parseInt(goalInput);
    if (isNaN(g) || g < 1) return;
    update.mutate({ glasses: today.glasses, goalGlasses: g });
    utils.hydration.history.invalidate();
    setEditingGoal(false);
    toast.success("Meta atualizada!");
  }

  const pct = Math.min(100, Math.round((today.glasses / today.goalGlasses) * 100));
  const achieved = today.glasses >= today.goalGlasses;

  return (
    <div className="fade-in" style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Droplets size={28} color="var(--primary)" /> Hidratação
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Acompanhe sua ingestão de água</p>
      </div>

      {/* Main tracker */}
      <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
        {/* Big display */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "5rem", fontWeight: 700, color: achieved ? "var(--primary)" : "var(--text)", lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
            {today.glasses}
          </div>
          <div style={{ fontSize: "1rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            de {today.goalGlasses} copos
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: "var(--surface-2)", borderRadius: "99px", height: 12, marginBottom: "0.75rem", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: achieved ? "var(--primary)" : "#0ea5e9", borderRadius: "99px", transition: "width 0.4s ease" }} />
        </div>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: achieved ? "var(--primary)" : "var(--text-muted)", fontWeight: achieved ? 600 : 400 }}>
          {achieved ? "🎉 Meta atingida hoje!" : `${pct}% da meta`}
        </p>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
          <button onClick={() => add(-1)} disabled={today.glasses === 0}
            style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid var(--border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", transition: "all 0.15s" }}>
            <Minus size={20} />
          </button>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => add(n)} className="btn-primary">
                +{n} {n === 1 ? "copo" : "copos"}
              </button>
            ))}
          </div>

          <button onClick={() => add(1)}
            style={{ width: 52, height: 52, borderRadius: "50%", border: "none", background: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.15s" }}>
            <Plus size={20} />
          </button>
        </div>

        {/* Glasses visualization */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginTop: "1.5rem" }}>
          {Array.from({ length: today.goalGlasses }).map((_, i) => (
            <span key={i} style={{ fontSize: "1.5rem", opacity: i < today.glasses ? 1 : 0.2, transition: "opacity 0.2s" }}>💧</span>
          ))}
        </div>
      </div>

      {/* Goal setting */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        {editingGoal ? (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500, flexShrink: 0 }}>Meta diária:</label>
            <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} min={1} max={30}
              style={{ flex: 1, padding: "0.5rem 0.75rem", border: "1.5px solid var(--primary)", borderRadius: "0.625rem", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", outline: "none" }} />
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>copos</span>
            <button className="btn-primary" onClick={saveGoal}>Salvar</button>
            <button className="btn-ghost" onClick={() => setEditingGoal(false)}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Meta diária: <strong>{today.goalGlasses} copos</strong></span>
            <button className="btn-ghost" onClick={() => { setGoalInput(String(today.goalGlasses)); setEditingGoal(true); }} style={{ gap: "0.4rem" }}>
              <Settings size={14} /> Ajustar
            </button>
          </div>
        )}
      </div>

      {/* Last 7 days */}
      {history.length > 1 && (
        <div>
          <h2 style={{ fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: "0 0 1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Últimos 7 dias</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {history.map(entry => {
              const p = Math.min(100, Math.round((entry.glasses / entry.goalGlasses) * 100));
              return (
                <div key={entry.id} className="card" style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{entry.date}</span>
                    <span style={{ fontSize: "0.875rem", color: p >= 100 ? "var(--primary)" : "var(--text-muted)" }}>
                      {entry.glasses}/{entry.goalGlasses} copos {p >= 100 ? "✓" : ""}
                    </span>
                  </div>
                  <div style={{ background: "var(--surface-2)", borderRadius: "99px", height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${p}%`, height: "100%", background: p >= 100 ? "var(--primary)" : "#0ea5e9", borderRadius: "99px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
