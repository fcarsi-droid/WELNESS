import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Utensils, Plus, Trash2, Search, Settings } from "lucide-react";
import toast from "react-hot-toast";

const MEALS = [
  { key: "breakfast", label: "Café da manhã", emoji: "🌅" },
  { key: "lunch", label: "Almoço", emoji: "☀️" },
  { key: "dinner", label: "Jantar", emoji: "🌙" },
  { key: "snack", label: "Lanche", emoji: "🍎" },
];

export default function CaloriesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<string>("lunch");
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualGrams, setManualGrams] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [selectedFood, setSelectedFood] = useState<{ id: number; name: string; caloriesPer100g: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const utils = trpc.useUtils();
  const { data: entries = [] } = trpc.calories.todayEntries.useQuery();
  const { data: goal = { dailyGoal: 2000 } } = trpc.calories.goal.useQuery();
  const { data: foods = [] } = trpc.calories.searchFood.useQuery({ q: debouncedSearch }, { enabled: debouncedSearch.length > 1 });

  const addEntry = trpc.calories.addEntry.useMutation({
    onSuccess: () => {
      utils.calories.todayEntries.invalidate();
      setShowAdd(false);
      setManualName(""); setManualCal(""); setManualGrams(""); setSearch(""); setSelectedFood(null);
      toast.success("Refeição adicionada!");
    },
  });

  const delEntry = trpc.calories.deleteEntry.useMutation({
    onSuccess: () => { utils.calories.todayEntries.invalidate(); toast.success("Removido"); },
  });

  const setGoal = trpc.calories.setGoal.useMutation({
    onSuccess: () => { utils.calories.goal.invalidate(); setEditGoal(false); toast.success("Meta atualizada!"); },
  });

  const totalCal = entries.reduce((s, e) => s + e.calories, 0);
  const pct = Math.min(100, Math.round((totalCal / goal.dailyGoal) * 100));
  const over = totalCal > goal.dailyGoal;

  const byMeal = MEALS.map(m => ({
    ...m,
    entries: entries.filter(e => e.meal === m.key),
    total: entries.filter(e => e.meal === m.key).reduce((s, e) => s + e.calories, 0),
  }));

  function handleAdd() {
    if (selectedFood && manualGrams) {
      const cal = (selectedFood.caloriesPer100g * parseFloat(manualGrams)) / 100;
      addEntry.mutate({ foodName: selectedFood.name, calories: cal, grams: parseFloat(manualGrams), meal: selectedMeal as any, foodItemId: selectedFood.id });
    } else if (manualName && manualCal) {
      addEntry.mutate({ foodName: manualName, calories: parseFloat(manualCal), grams: manualGrams ? parseFloat(manualGrams) : undefined, meal: selectedMeal as any });
    } else {
      toast.error("Preencha o alimento e as calorias");
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Utensils size={28} color="var(--primary)" /> Calorias
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Acompanhe sua alimentação diária</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(v => !v)}>
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <span style={{ fontSize: "2.5rem", fontWeight: 700, color: over ? "#ef4444" : "var(--primary)", fontFamily: "'Playfair Display', serif" }}>{Math.round(totalCal)}</span>
            <span style={{ fontSize: "1rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>/ {goal.dailyGoal} kcal</span>
          </div>
          {editGoal ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                style={{ width: 90, padding: "0.4rem 0.6rem", border: "1.5px solid var(--primary)", borderRadius: "0.5rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none" }} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kcal</span>
              <button className="btn-primary" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }} onClick={() => setGoal.mutate({ dailyGoal: parseFloat(goalInput) })}>Ok</button>
              <button className="btn-ghost" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }} onClick={() => setEditGoal(false)}>✕</button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => { setGoalInput(String(goal.dailyGoal)); setEditGoal(true); }}>
              <Settings size={14} /> Meta
            </button>
          )}
        </div>
        <div style={{ background: "var(--surface-2)", borderRadius: "99px", height: 10, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: over ? "#ef4444" : "var(--primary)", borderRadius: "99px", transition: "width 0.4s ease" }} />
        </div>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: over ? "#ef4444" : "var(--text-muted)" }}>
          {over ? `${Math.round(totalCal - goal.dailyGoal)} kcal acima da meta` : `${Math.round(goal.dailyGoal - totalCal)} kcal restantes`}
        </p>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card fade-in" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }}>Adicionar refeição</h3>

          {/* Meal selector */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {MEALS.map(m => (
              <button key={m.key} onClick={() => setSelectedMeal(m.key)}
                style={{ padding: "0.4rem 0.875rem", border: `2px solid ${selectedMeal === m.key ? "var(--primary)" : "var(--border)"}`, borderRadius: "99px", background: selectedMeal === m.key ? "var(--primary-light)" : "white", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500, color: selectedMeal === m.key ? "var(--primary)" : "var(--text-muted)" }}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          {/* Search food */}
          <div style={{ position: "relative", marginBottom: "0.75rem" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setSelectedFood(null); }}
              placeholder="Buscar alimento..."
              style={{ width: "100%", padding: "0.625rem 0.875rem 0.625rem 2.25rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Food results */}
          {foods.length > 0 && !selectedFood && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "0.75rem" }}>
              {foods.map(f => (
                <button key={f.id} onClick={() => { setSelectedFood(f); setSearch(f.name); }}
                  style={{ width: "100%", padding: "0.625rem 1rem", display: "flex", justifyContent: "space-between", background: "white", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", textAlign: "left" }}>
                  <span>{f.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{f.caloriesPer100g} kcal/100g</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            {!selectedFood && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>Nome do alimento</label>
                <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Ex: Arroz branco"
                  style={{ width: "100%", padding: "0.625rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                {selectedFood ? `Quantidade (g) → ${selectedFood.caloriesPer100g} kcal/100g` : "Calorias (kcal)"}
              </label>
              <input value={selectedFood ? manualGrams : manualCal} onChange={e => selectedFood ? setManualGrams(e.target.value) : setManualCal(e.target.value)}
                type="number" placeholder={selectedFood ? "Ex: 150" : "Ex: 250"}
                style={{ width: "100%", padding: "0.625rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {selectedFood && manualGrams && (
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "var(--primary)", fontWeight: 500 }}>
              ≈ {Math.round((selectedFood.caloriesPer100g * parseFloat(manualGrams || "0")) / 100)} kcal
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-primary" onClick={handleAdd} disabled={addEntry.isPending} style={{ flex: 1, justifyContent: "center" }}>
              {addEntry.isPending ? "Adicionando..." : "Adicionar"}
            </button>
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Meals by category */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {byMeal.filter(m => m.entries.length > 0).map(m => (
          <div key={m.key} className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {m.emoji} {m.label}
              </h3>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--primary)" }}>{Math.round(m.total)} kcal</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {m.entries.map(e => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.4rem 0", borderBottom: "1px solid var(--surface-2)" }}>
                  <span style={{ flex: 1, fontSize: "0.875rem" }}>{e.foodName}</span>
                  {e.grams && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{e.grams}g</span>}
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", minWidth: 60, textAlign: "right" }}>{Math.round(e.calories)} kcal</span>
                  <button onClick={() => delEntry.mutate({ id: e.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: "0.2rem" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🍽️</p>
            <p>Nenhuma refeição registrada hoje</p>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Adicionar primeira refeição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
