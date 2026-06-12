import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Droplets, Plus, Minus, Settings, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";

export default function HydrationPage() {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("8");
  const [editingDate, setEditingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const utils = trpc.useUtils();
  const { data: entry = { glasses:0, goalGlasses:8 }, isLoading } = trpc.hydration.getByDate.useQuery({ date: selectedDate });
  const { data: history = [] } = trpc.hydration.history.useQuery({ days: 7 });

  const update = trpc.hydration.update.useMutation({
    onSuccess: () => { utils.hydration.getByDate.invalidate(); utils.hydration.history.invalidate(); },
  });

  function add(n: number) {
    const newVal = Math.max(0, (entry as any).glasses + n);
    update.mutate({ glasses: newVal, date: selectedDate });
    if (n > 0 && newVal === (entry as any).goalGlasses) toast.success("Meta atingida!");
  }

  function saveGoal() {
    const g = parseInt(goalInput);
    if (isNaN(g) || g < 1) return;
    update.mutate({ glasses: (entry as any).glasses, goalGlasses: g, date: selectedDate });
    utils.hydration.history.invalidate();
    setEditingGoal(false);
    toast.success("Meta atualizada!");
  }

  const glasses = (entry as any).glasses || 0;
  const goalGlasses = (entry as any).goalGlasses || 8;
  const pct = Math.min(100, Math.round((glasses / goalGlasses) * 100));
  const achieved = glasses >= goalGlasses;
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="fade-in" style={{ maxWidth:600, margin:"0 auto" }}>
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"#60A5FA", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Droplets size={24} color="white"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:"1.75rem" }}>Hidratação</h1>
            <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>Acompanhe sua ingestão de água</p>
          </div>
        </div>
        <button className="btn-ghost" onClick={()=>setEditingDate(v=>!v)} style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <CalendarDays size={15}/> {isToday ? "Hoje" : selectedDate}
        </button>
      </div>

      {/* Date selector */}
      {editingDate && (
        <div className="card fade-in" style={{ padding:"1rem 1.25rem", marginBottom:"1rem", display:"flex", alignItems:"center", gap:"1rem" }}>
          <label style={{ fontSize:"0.875rem", fontWeight:500, flexShrink:0 }}>Editar data:</label>
          <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} max={new Date().toISOString().split("T")[0]}
            style={{ flex:1, padding:"0.5rem 0.75rem", border:"1.5px solid var(--primary)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none" }}/>
          <button className="btn-primary" onClick={()=>setEditingDate(false)}>Ok</button>
        </div>
      )}

      {/* Main tracker */}
      <div className="card" style={{ padding:"2rem", marginBottom:"1.5rem", textAlign:"center" }}>
        {!isToday && (
          <div style={{ marginBottom:"1rem", padding:"0.5rem 1rem", background:"#fefce8", borderRadius:"0.75rem", border:"1px solid #fde68a", fontSize:"0.8rem", color:"#ca8a04", fontWeight:500 }}>
            Editando: {new Date(selectedDate+"T12:00:00").toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long"})}
          </div>
        )}

        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"5rem", fontWeight:700, color:achieved?"var(--primary)":"var(--text)", lineHeight:1, fontFamily:"'Playfair Display',serif" }}>
            {glasses}
          </div>
          <div style={{ fontSize:"1rem", color:"var(--text-muted)", marginTop:"0.25rem" }}>de {goalGlasses} copos</div>
        </div>

        <div style={{ background:"var(--surface-2)", borderRadius:"99px", height:12, marginBottom:"0.75rem", overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:achieved?"var(--primary)":"#0ea5e9", borderRadius:"99px", transition:"width 0.4s ease" }}/>
        </div>
        <p style={{ margin:"0 0 1.5rem", fontSize:"0.875rem", color:achieved?"var(--primary)":"var(--text-muted)", fontWeight:achieved?600:400 }}>
          {achieved ? "Meta atingida!" : `${pct}% da meta`}
        </p>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"1.5rem", flexWrap:"wrap" }}>
          <button onClick={()=>add(-1)} disabled={glasses===0}
            style={{ width:52, height:52, borderRadius:"50%", border:"2px solid var(--border)", background:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", transition:"all 0.15s" }}>
            <Minus size={20}/>
          </button>
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", justifyContent:"center" }}>
            {[1,2,3].map(n=>(
              <button key={n} onClick={()=>add(n)} className="btn-primary">+{n} {n===1?"copo":"copos"}</button>
            ))}
          </div>
          <button onClick={()=>add(1)}
            style={{ width:52, height:52, borderRadius:"50%", border:"none", background:"var(--primary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", transition:"all 0.15s" }}>
            <Plus size={20}/>
          </button>
        </div>

        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", justifyContent:"center", marginTop:"1.5rem" }}>
          {Array.from({length:goalGlasses}).map((_,i)=>(
            <Droplets key={i} size={22} color={i<glasses?"#0ea5e9":"#d1d5db"} style={{ transition:"color 0.2s" }}/>
          ))}
        </div>
      </div>

      {/* Goal setting */}
      <div className="card" style={{ padding:"1.25rem", marginBottom:"1.5rem" }}>
        {editingGoal ? (
          <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
            <label style={{ fontSize:"0.875rem", fontWeight:500, flexShrink:0 }}>Meta diária:</label>
            <input type="number" value={goalInput} onChange={e=>setGoalInput(e.target.value)} min={1} max={30}
              style={{ flex:1, padding:"0.5rem 0.75rem", border:"1.5px solid var(--primary)", borderRadius:"0.625rem", fontFamily:"'DM Sans',sans-serif", fontSize:"1rem", outline:"none" }}/>
            <span style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>copos</span>
            <button className="btn-primary" onClick={saveGoal}>Salvar</button>
            <button className="btn-ghost" onClick={()=>setEditingGoal(false)}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>Meta diária: <strong>{goalGlasses} copos</strong></span>
            <button className="btn-ghost" onClick={()=>{ setGoalInput(String(goalGlasses)); setEditingGoal(true); }} style={{ gap:"0.4rem" }}>
              <Settings size={14}/> Ajustar
            </button>
          </div>
        )}
      </div>

      {/* Last 7 days */}
      {(history as any[]).length > 1 && (
        <div>
          <h2 style={{ fontSize:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontWeight:700, margin:"0 0 1rem", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Últimos 7 dias</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(history as any[]).map(e=>{
              const p = Math.min(100, Math.round((e.glasses/e.goalGlasses)*100));
              return (
                <div key={e.id||e.date} className="card" style={{ padding:"0.875rem 1.25rem", cursor:"pointer" }}
                  onClick={()=>{ setSelectedDate(e.date); setEditingDate(false); }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem" }}>
                    <span style={{ fontSize:"0.875rem", fontWeight:500 }}>{e.date}</span>
                    <span style={{ fontSize:"0.875rem", color:p>=100?"var(--primary)":"var(--text-muted)" }}>
                      {e.glasses}/{e.goalGlasses} copos {p>=100?"✓":""}
                    </span>
                  </div>
                  <div style={{ background:"var(--surface-2)", borderRadius:"99px", height:6, overflow:"hidden" }}>
                    <div style={{ width:`${p}%`, height:"100%", background:p>=100?"var(--primary)":"#0ea5e9", borderRadius:"99px" }}/>
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
