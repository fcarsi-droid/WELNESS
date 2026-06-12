import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Utensils, Plus, Trash2, Search, Settings, ChevronDown, X, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const MEALS = [
  { key: "breakfast", label: "Café da manhã", icon: "ti-coffee", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  { key: "lunch", label: "Almoço", icon: "ti-sun", color: "#eab308", bg: "#fefce8", border: "#fde68a" },
  { key: "dinner", label: "Jantar", icon: "ti-moon", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "snack", label: "Lanche", icon: "ti-apple", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
];

export default function CaloriesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("lunch");
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualGrams, setManualGrams] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showFoodCatalog, setShowFoodCatalog] = useState(false);
  const [showNewFood, setShowNewFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCal, setNewFoodCal] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("2000");
  const [selectedFood, setSelectedFood] = useState<{ id: number; name: string; caloriesPer100g: number } | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogDebouncedSearch, setCatalogDebouncedSearch] = useState("");

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const t = setTimeout(() => setCatalogDebouncedSearch(catalogSearch), 300); return () => clearTimeout(t); }, [catalogSearch]);

  const utils = trpc.useUtils();
  const { data: entries = [] } = trpc.calories.todayEntries.useQuery();
  const { data: goal = { dailyGoal: 2000 } } = trpc.calories.goal.useQuery();
  const { data: foods = [] } = trpc.calories.searchFood.useQuery({ q: debouncedSearch }, { enabled: debouncedSearch.length > 1 });
  const { data: allFoods = [] } = trpc.calories.getAllFoods.useQuery();
  const catalogFiltered = catalogDebouncedSearch.length > 1
    ? (allFoods as any[]).filter(f => f.name.toLowerCase().includes(catalogDebouncedSearch.toLowerCase()))
    : allFoods as any[];

  const addEntry = trpc.calories.addEntry.useMutation({
    onSuccess: () => { utils.calories.todayEntries.invalidate(); setShowAdd(false); setManualName(""); setManualCal(""); setManualGrams(""); setSearch(""); setSelectedFood(null); toast.success("Refeição adicionada!"); },
  });
  const delEntry = trpc.calories.deleteEntry.useMutation({ onSuccess: () => utils.calories.todayEntries.invalidate() });
  const setGoal = trpc.calories.setGoal.useMutation({ onSuccess: () => { utils.calories.goal.invalidate(); setEditGoal(false); toast.success("Meta atualizada!"); } });
  const addFoodItem = trpc.calories.addFoodItem.useMutation({
    onSuccess: () => { utils.calories.getAllFoods.invalidate(); setShowNewFood(false); setNewFoodName(""); setNewFoodCal(""); toast.success("Alimento cadastrado!"); },
  });

  const totalCal = (entries as any[]).reduce((s, e) => s + e.calories, 0);
  const pct = Math.min(100, Math.round((totalCal / goal.dailyGoal) * 100));
  const over = totalCal > goal.dailyGoal;

  const byMeal = MEALS.map(m => ({
    ...m,
    entries: (entries as any[]).filter(e => e.meal === m.key),
    total: (entries as any[]).filter(e => e.meal === m.key).reduce((s: number, e: any) => s + e.calories, 0),
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

  function selectFromCatalog(food: any) {
    setSelectedFood(food);
    setSearch(food.name);
    setShowFoodCatalog(false);
    setShowAdd(true);
  }

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  return (
    <div className="fade-in" style={{ maxWidth:720, margin:"0 auto" }}>
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"#FB923C", display:"flex", alignItems:"center", justifyContent:"center" }}><Utensils size={24} color="white"/></div> Calorias
          </h1>
          <p style={{ margin:0, color:"var(--text-muted)" }}>Acompanhe sua alimentação diária</p>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn-ghost" onClick={()=>setShowFoodCatalog(true)}>
            <BookOpen size={16}/> Tabela de alimentos
          </button>
          <button className="btn-primary" onClick={()=>setShowAdd(v=>!v)} style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
            <Plus size={16}/> Adicionar
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding:"1.5rem", marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
          <div>
            <span style={{ fontSize:"2.5rem", fontWeight:700, color:over?"#ef4444":"var(--text)", fontFamily:"'Playfair Display',serif" }}>{Math.round(totalCal)}</span>
            <span style={{ fontSize:"1rem", color:"var(--text-muted)", marginLeft:"0.4rem" }}>/ {goal.dailyGoal} kcal</span>
          </div>
          {editGoal ? (
            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
              <input type="number" value={goalInput} onChange={e=>setGoalInput(e.target.value)}
                style={{ width:90, padding:"0.4rem 0.6rem", border:"1.5px solid var(--primary)", borderRadius:"0.5rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", outline:"none" }}/>
              <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>kcal</span>
              <button className="btn-primary" style={{ padding:"0.4rem 0.75rem", fontSize:"0.8rem" }} onClick={()=>setGoal.mutate({dailyGoal:parseFloat(goalInput)})}>Ok</button>
              <button className="btn-ghost" style={{ padding:"0.4rem 0.75rem", fontSize:"0.8rem" }} onClick={()=>setEditGoal(false)}>✕</button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={()=>{ setGoalInput(String(goal.dailyGoal)); setEditGoal(true); }}>
              <Settings size={14}/> Meta
            </button>
          )}
        </div>
        <div style={{ background:"var(--surface-2)", borderRadius:"99px", height:10, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:over?"#ef4444":"linear-gradient(90deg, #FB923C, #ea580c)", borderRadius:"99px", transition:"width 0.4s ease" }}/>
        </div>
        <p style={{ margin:"0.5rem 0 0", fontSize:"0.8rem", color:over?"#ef4444":"var(--text-muted)" }}>
          {over ? `${Math.round(totalCal-goal.dailyGoal)} kcal acima da meta` : `${Math.round(goal.dailyGoal-totalCal)} kcal restantes`}
        </p>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"1rem", fontWeight:600 }}>Adicionar refeição</h3>
            <button className="btn-ghost" onClick={()=>setShowAdd(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>

          {/* Meal selector */}
          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap" }}>
            {MEALS.map(m=>(
              <button key={m.key} onClick={()=>setSelectedMeal(m.key)}
                style={{ padding:"0.4rem 0.875rem", border:`2px solid ${selectedMeal===m.key?"#FB923C":"var(--border)"}`, borderRadius:"99px", background:selectedMeal===m.key?"#fff7ed":"white", cursor:"pointer", fontSize:"0.8rem", fontWeight:500, color:selectedMeal===m.key?"#FB923C":"var(--text-muted)" }}>
                <i className={`ti ${m.icon}`} style={{ fontSize:15, color:m.color, verticalAlign:-2, marginRight:5 }} aria-hidden="true"/>{m.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position:"relative", marginBottom:"0.75rem" }}>
            <Search size={16} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
            <input value={search} onChange={e=>{ setSearch(e.target.value); setSelectedFood(null); }}
              placeholder="Buscar alimento na tabela..."
              style={{...inputStyle, paddingLeft:"2.25rem"}}/>
          </div>

          {(foods as any[]).length > 0 && !selectedFood && (
            <div style={{ border:"1px solid var(--border)", borderRadius:"0.75rem", overflow:"hidden", marginBottom:"0.75rem", maxHeight:200, overflowY:"auto" }}>
              {(foods as any[]).map((f:any)=>(
                <button key={f.id} onClick={()=>{ setSelectedFood(f); setSearch(f.name); }}
                  style={{ width:"100%", padding:"0.625rem 1rem", display:"flex", justifyContent:"space-between", background:"white", border:"none", borderBottom:"1px solid var(--border)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", textAlign:"left" }}>
                  <span>{f.name}</span>
                  <span style={{ color:"var(--text-muted)", flexShrink:0 }}>{f.caloriesPer100g} kcal/100g</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1rem" }}>
            {!selectedFood && (
              <div>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Nome do alimento</label>
                <input value={manualName} onChange={e=>setManualName(e.target.value)} placeholder="Ex: Arroz branco" style={inputStyle}/>
              </div>
            )}
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>
                {selectedFood ? `Quantidade (g) · ${selectedFood.caloriesPer100g} kcal/100g` : "Calorias (kcal)"}
              </label>
              <input value={selectedFood ? manualGrams : manualCal} onChange={e=>selectedFood ? setManualGrams(e.target.value) : setManualCal(e.target.value)}
                type="number" placeholder={selectedFood ? "Ex: 150" : "Ex: 250"} style={inputStyle}/>
            </div>
          </div>

          {selectedFood && manualGrams && (
            <p style={{ margin:"0 0 0.75rem", fontSize:"0.875rem", color:"#FB923C", fontWeight:500 }}>
              ≈ {Math.round((selectedFood.caloriesPer100g * parseFloat(manualGrams||"0"))/100)} kcal
            </p>
          )}

          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button className="btn-primary" onClick={handleAdd} disabled={addEntry.isPending} style={{ flex:1, justifyContent:"center", background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
              {addEntry.isPending ? "Adicionando..." : "Adicionar"}
            </button>
            <button className="btn-ghost" onClick={()=>setShowAdd(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Food catalog modal */}
      {showFoodCatalog && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={()=>setShowFoodCatalog(false)}>
          <div style={{ background:"white", borderRadius:"1.25rem", maxWidth:640, width:"100%", maxHeight:"85vh", display:"flex", flexDirection:"column" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"1.5rem 1.5rem 1rem", borderBottom:"1px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                <h2 style={{ margin:0, fontSize:"1.25rem" }}>Tabela de Alimentos</h2>
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button className="btn-ghost" onClick={()=>setShowNewFood(v=>!v)} style={{ fontSize:"0.8rem" }}>
                    <Plus size={14}/> Cadastrar novo
                  </button>
                  <button className="btn-ghost" onClick={()=>setShowFoodCatalog(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
                </div>
              </div>

              {showNewFood && (
                <div style={{ background:"var(--surface-2)", borderRadius:"0.875rem", padding:"1rem", marginBottom:"1rem" }}>
                  <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:600, color:"var(--text-muted)" }}>Cadastrar alimento</p>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"0.5rem", marginBottom:"0.75rem" }}>
                    <input value={newFoodName} onChange={e=>setNewFoodName(e.target.value)} placeholder="Nome do alimento" style={inputStyle}/>
                    <input type="number" value={newFoodCal} onChange={e=>setNewFoodCal(e.target.value)} placeholder="kcal/100g" style={inputStyle}/>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="btn-primary" onClick={()=>{ if(!newFoodName||!newFoodCal) return toast.error("Preencha nome e calorias"); addFoodItem.mutate({name:newFoodName, caloriesPer100g:parseFloat(newFoodCal)}); }}
                      style={{ fontSize:"0.8rem" }}>Cadastrar</button>
                    <button className="btn-ghost" onClick={()=>setShowNewFood(false)} style={{ fontSize:"0.8rem" }}>Cancelar</button>
                  </div>
                </div>
              )}

              <div style={{ position:"relative" }}>
                <Search size={15} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)" }}/>
                <input value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)} placeholder={`Buscar entre ${(allFoods as any[]).length} alimentos...`}
                  style={{...inputStyle, paddingLeft:"2.2rem"}}/>
              </div>
            </div>

            <div style={{ overflowY:"auto", flex:1 }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"var(--surface-2)", position:"sticky", top:0 }}>
                    <th style={{ padding:"0.625rem 1.25rem", textAlign:"left", fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Alimento</th>
                    <th style={{ padding:"0.625rem 1rem", textAlign:"right", fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>kcal/100g</th>
                    <th style={{ padding:"0.625rem 1rem", width:100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(catalogFiltered as any[]).map((f:any, i:number)=>(
                    <tr key={f.id} style={{ borderBottom:"1px solid var(--surface-2)", background:i%2===0?"white":"var(--surface)" }}>
                      <td style={{ padding:"0.625rem 1.25rem", fontSize:"0.875rem" }}>
                        {f.name}
                        {!f.isDefault && <span style={{ marginLeft:"0.5rem", fontSize:"0.65rem", background:"#eff6ff", color:"#2563eb", padding:"0.1rem 0.4rem", borderRadius:"99px", fontWeight:600 }}>personalizado</span>}
                      </td>
                      <td style={{ padding:"0.625rem 1rem", fontSize:"0.875rem", fontWeight:600, color:"#FB923C", textAlign:"right" }}>{f.caloriesPer100g}</td>
                      <td style={{ padding:"0.625rem 1rem" }}>
                        <button onClick={()=>selectFromCatalog(f)}
                          style={{ background:"#fff7ed", border:"1px solid #fdba74", borderRadius:"0.5rem", padding:"0.3rem 0.625rem", cursor:"pointer", fontSize:"0.75rem", fontWeight:500, color:"#ea580c", width:"100%" }}>
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(catalogFiltered as any[]).length===0 && (
                <p style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum alimento encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meals */}
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
        {byMeal.filter(m=>m.entries.length>0).map(m=>(
          <div key={m.key} className="card" style={{ padding:"1.25rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
              <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.95rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <i className={`ti ${m.icon}`} style={{ fontSize:15, color:m.color, verticalAlign:-2, marginRight:5 }} aria-hidden="true"/>{m.label}
              </h3>
              <span style={{ fontSize:"0.875rem", fontWeight:600, color:"#FB923C" }}>{Math.round(m.total)} kcal</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
              {m.entries.map((e:any)=>(
                <div key={e.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.4rem 0", borderBottom:"1px solid var(--surface-2)" }}>
                  <span style={{ flex:1, fontSize:"0.875rem" }}>{e.foodName}</span>
                  {e.grams && <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{e.grams}g</span>}
                  <span style={{ fontSize:"0.875rem", fontWeight:500, color:"var(--text-muted)", minWidth:60, textAlign:"right" }}>{Math.round(e.calories)} kcal</span>
                  <button onClick={()=>delEntry.mutate({id:e.id})} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:"0.2rem", display:"flex" }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(entries as any[]).length===0 && (
          <div style={{ textAlign:"center", padding:"3rem 2rem", color:"var(--text-muted)" }}>
            <div style={{ width:64, height:64, borderRadius:18, background:"#fff7ed", border:"1.5px solid #fed7aa", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 0.75rem" }}>
              <i className="ti ti-tools-kitchen-2" style={{ fontSize:34, color:"#FB923C" }} aria-hidden="true"/>
            </div>
            <p style={{ marginBottom:"1.5rem" }}>Nenhuma refeição registrada hoje</p>
            <button className="btn-primary" onClick={()=>setShowAdd(true)} style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
              <Plus size={16}/> Adicionar primeira refeição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
