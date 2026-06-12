import { useState } from "react";
import { trpc } from "../lib/trpc";
import { formatDate } from "../lib/utils";
import { Smile, Plus, Trash2, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const MOODS = [
  { level: "1" as const, icon: "ti-mood-sad", label: "Péssimo", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { level: "2" as const, icon: "ti-mood-confuzed", label: "Ruim", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" },
  { level: "3" as const, icon: "ti-mood-neutral", label: "Ok", color: "#eab308", bg: "#fefce8", border: "#fde68a" },
  { level: "4" as const, icon: "ti-mood-smile", label: "Bem", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
  { level: "5" as const, icon: "ti-mood-happy", label: "Ótimo", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
];

function getMood(level: string) { return MOODS.find(m => m.level === level); }

function MoodIcon({ level, size = 48 }: { level: string; size?: number }) {
  const mood = getMood(level);
  if (!mood) return null;
  const radius = Math.round(size * 0.29);
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: mood.bg, border: `1.5px solid ${mood.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <i className={`ti ${mood.icon}`} style={{ fontSize: size * 0.54, color: mood.color }} aria-hidden="true"/>
    </div>
  );
}

function groupByDate(entries: any[]) {
  const groups: Record<string, any[]> = {};
  entries.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });
  return groups;
}

function DayTimeline({ entries, date, onDelete, onSaveReflection }: any) {
  const [expandedId, setExpandedId] = useState<number|null>(null);
  const [drafts, setDrafts] = useState<Record<number,{reflection:string;learning:string}>>({});
  const first = entries[0];
  const last = entries[entries.length-1];
  const moodChanged = entries.length > 1 && first?.level !== last?.level;
  const isToday = date === new Date().toISOString().split("T")[0];

  function openReflection(entry: any) {
    if (!drafts[entry.id]) setDrafts(d => ({...d, [entry.id]: {reflection: entry.reflection||"", learning: entry.learning||""}}));
    setExpandedId(expandedId === entry.id ? null : entry.id);
  }

  return (
    <div className="card" style={{ padding:"1.25rem", marginBottom:"0.875rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-muted)" }}>
          {isToday ? "Hoje" : formatDate(date)}
        </span>
        {entries.length > 1 && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <MoodIcon level={first.level} size={28}/>
            <div style={{ width:32, height:2, background:`linear-gradient(90deg, ${getMood(first.level)?.color}, ${getMood(last.level)?.color})`, borderRadius:1 }}/>
            <MoodIcon level={last.level} size={28}/>
          </div>
        )}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {entries.map((entry: any, i: number) => {
          const mood = getMood(entry.level);
          const isExpanded = expandedId === entry.id;
          const draft = drafts[entry.id];
          const hasReflection = entry.reflection || entry.learning;
          return (
            <div key={entry.id}>
              <div style={{ display:"flex", gap:"0.875rem", alignItems:"flex-start" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                  <MoodIcon level={entry.level} size={36}/>
                  {i < entries.length-1 && <div style={{ width:2, height:20, background:"var(--border)", marginTop:4 }}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <span style={{ fontWeight:600, color:mood?.color, fontSize:"0.875rem" }}>{mood?.label}</span>
                      {entry.time && <span style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{entry.time}</span>}
                    </div>
                    <div style={{ display:"flex", gap:"0.375rem" }}>
                      <button onClick={()=>openReflection(entry)}
                        style={{ background:isExpanded?"#eff6ff":hasReflection?"#f0fdf4":"none", border:"none", cursor:"pointer", color:isExpanded?"#3b82f6":hasReflection?"#16a34a":"var(--text-muted)", padding:"0.25rem 0.5rem", borderRadius:"0.5rem", display:"flex", alignItems:"center", gap:"0.25rem", fontSize:"0.72rem", fontWeight:500 }}>
                        <BookOpen size={12}/> {hasReflection ? "Ver" : "Refletir"}
                      </button>
                      <button onClick={()=>onDelete(entry.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:"0.2rem", display:"flex" }}><Trash2 size={13}/></button>
                    </div>
                  </div>
                  {entry.note && <p style={{ margin:"0.2rem 0 0", fontSize:"0.8rem", color:"var(--text-muted)" }}>{entry.note}</p>}
                  {isExpanded && (
                    <div style={{ marginTop:"0.75rem", padding:"0.875rem", background:"var(--surface-2)", borderRadius:"0.75rem" }}>
                      {hasReflection && !draft ? (
                        <>
                          {entry.reflection && <p style={{ margin:"0 0 0.4rem", fontSize:"0.8rem" }}><strong style={{ color:"var(--text-muted)", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.04em" }}>O que aconteceu</strong><br/>{entry.reflection}</p>}
                          {entry.learning && <p style={{ margin:0, fontSize:"0.8rem" }}><strong style={{ color:"var(--text-muted)", fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.04em" }}>O que aprendi</strong><br/>{entry.learning}</p>}
                          <button onClick={()=>{ setDrafts(d=>({...d,[entry.id]:{reflection:entry.reflection||"",learning:entry.learning||""}})); }}
                            style={{ marginTop:"0.625rem", background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", color:"var(--text-muted)", padding:0, textDecoration:"underline" }}>Editar reflexão</button>
                        </>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                          <div>
                            <label style={{ display:"block", fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", marginBottom:"0.25rem", textTransform:"uppercase", letterSpacing:"0.04em" }}>O que aconteceu?</label>
                            <textarea value={draft?.reflection||""} onChange={e=>setDrafts(d=>({...d,[entry.id]:{...d[entry.id],reflection:e.target.value}}))}
                              placeholder="Descreva o que influenciou seu humor..."
                              style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1.5px solid var(--border)", borderRadius:"0.625rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", resize:"vertical", minHeight:60, outline:"none", boxSizing:"border-box" }}/>
                          </div>
                          <div>
                            <label style={{ display:"block", fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", marginBottom:"0.25rem", textTransform:"uppercase", letterSpacing:"0.04em" }}>O que você aprendeu sobre si mesmo hoje?</label>
                            <textarea value={draft?.learning||""} onChange={e=>setDrafts(d=>({...d,[entry.id]:{...d[entry.id],learning:e.target.value}}))}
                              placeholder="Uma descoberta, padrão ou insight sobre você..."
                              style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1.5px solid var(--border)", borderRadius:"0.625rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", resize:"vertical", minHeight:60, outline:"none", boxSizing:"border-box" }}/>
                          </div>
                          <button className="btn-primary" style={{ fontSize:"0.8rem", alignSelf:"flex-start" }}
                            onClick={()=>{ onSaveReflection(entry.id, draft?.reflection||"", draft?.learning||""); setExpandedId(null); }}>
                            Salvar reflexão
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {moodChanged && !last.reflection && !last.learning && expandedId !== last.id && (
        <div style={{ marginTop:"0.875rem", padding:"0.875rem", background:"#eff6ff", borderRadius:"0.75rem", border:"1px solid #bfdbfe" }}>
          <p style={{ margin:"0 0 0.3rem", fontSize:"0.8rem", fontWeight:600, color:"#1d4ed8" }}>
            Seu humor mudou hoje
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", margin:"0.3rem 0 0.5rem" }}>
            <MoodIcon level={first.level} size={24}/>
            <span style={{ color:"var(--text-muted)", fontSize:"0.8rem" }}>→</span>
            <MoodIcon level={last.level} size={24}/>
          </div>
          <p style={{ margin:"0 0 0.5rem", fontSize:"0.75rem", color:"#3b82f6" }}>Que tal registrar uma reflexão sobre o que aconteceu?</p>
          <button onClick={()=>openReflection(last)}
            style={{ background:"#3b82f6", color:"white", border:"none", borderRadius:"0.5rem", padding:"0.35rem 0.75rem", cursor:"pointer", fontSize:"0.75rem", fontWeight:600 }}>
            Refletir sobre o dia
          </button>
        </div>
      )}
    </div>
  );
}

export default function MoodPage() {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<"1"|"2"|"3"|"4"|"5"|null>(null);
  const [note, setNote] = useState("");

  const utils = trpc.useUtils();
  const { data: todayEntries = [] } = trpc.mood.today.useQuery();
  const { data: history = [] } = trpc.mood.history.useQuery({ days: 30 });

  const add = trpc.mood.add.useMutation({
    onSuccess: () => { utils.mood.today.invalidate(); utils.mood.history.invalidate(); setShowForm(false); setSelected(null); setNote(""); toast.success("Humor registrado!"); },
  });
  const update = trpc.mood.update.useMutation({
    onSuccess: () => { utils.mood.today.invalidate(); utils.mood.history.invalidate(); toast.success("Reflexão salva!"); },
  });
  const del = trpc.mood.delete.useMutation({
    onSuccess: () => { utils.mood.today.invalidate(); utils.mood.history.invalidate(); },
  });

  const today = new Date().toISOString().split("T")[0];
  const historyByDate = groupByDate((history as any[]).filter(e => e.date !== today));
  const sortedDates = Object.keys(historyByDate).sort((a,b) => b.localeCompare(a));

  return (
    <div className="fade-in" style={{ maxWidth:700, margin:"0 auto" }}>
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"#F472B6", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Smile size={24} color="white"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:"1.75rem" }}>Humor</h1>
            <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>
              {(todayEntries as any[]).length > 0 ? `${(todayEntries as any[]).length} registro${(todayEntries as any[]).length>1?"s":""} hoje` : "Nenhum registro hoje"}
            </p>
          </div>
        </div>
        <button className="btn-primary" onClick={()=>setShowForm(v=>!v)} style={{ background:"linear-gradient(135deg, #F472B6, #ec4899)" }}>
          <Plus size={16}/> Registrar humor
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ padding:"1.75rem", marginBottom:"1.5rem" }}>
          <p style={{ margin:"0 0 1.25rem", fontWeight:600 }}>Como você está agora?</p>
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
            {MOODS.map(m => (
              <button key={m.level} onClick={() => setSelected(m.level)}
                style={{ flex:1, minWidth:70, padding:"1rem 0.5rem", border:`2px solid ${selected===m.level ? m.color : "var(--border)"}`, borderRadius:"0.875rem", background:selected===m.level ? m.bg : "white", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem", transition:"all 0.15s" }}>
                <div style={{ width:44, height:44, borderRadius:13, background:m.bg, border:`1.5px solid ${m.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <i className={`ti ${m.icon}`} style={{ fontSize:24, color:m.color }} aria-hidden="true"/>
                </div>
                <span style={{ fontSize:"0.75rem", fontWeight:500, color:selected===m.level ? m.color : "var(--text-muted)" }}>{m.label}</span>
              </button>
            ))}
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Alguma observação? (opcional)"
            style={{ width:"100%", padding:"0.75rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", resize:"vertical", minHeight:70, outline:"none", marginBottom:"1rem", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="#F472B6"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button className="btn-primary" onClick={()=>{ if(!selected) return toast.error("Selecione um humor"); add.mutate({level:selected,note:note||undefined}); }}
              disabled={add.isPending} style={{ flex:1, justifyContent:"center", background:"linear-gradient(135deg, #F472B6, #ec4899)" }}>
              {add.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button className="btn-ghost" onClick={()=>{setShowForm(false);setSelected(null);setNote("");}}>Cancelar</button>
          </div>
        </div>
      )}

      {(todayEntries as any[]).length > 0 && (
        <div style={{ marginBottom:"1.5rem" }}>
          <h2 style={{ fontSize:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontWeight:700, margin:"0 0 0.875rem", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Hoje</h2>
          <DayTimeline entries={todayEntries} date={today} onDelete={(id:number)=>del.mutate({id})}
            onSaveReflection={(id:number,reflection:string,learning:string)=>update.mutate({id,reflection,learning})}/>
        </div>
      )}

      {sortedDates.length > 0 && (
        <div>
          <h2 style={{ fontSize:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontWeight:700, margin:"0 0 0.875rem", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Histórico</h2>
          {sortedDates.map(date=>(
            <DayTimeline key={date} entries={historyByDate[date]} date={date} onDelete={(id:number)=>del.mutate({id})}
              onSaveReflection={(id:number,reflection:string,learning:string)=>update.mutate({id,reflection,learning})}/>
          ))}
        </div>
      )}

      {(todayEntries as any[]).length===0 && sortedDates.length===0 && (
        <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
          <div style={{ width:72, height:72, borderRadius:21, background:"#eff6ff", border:"1.5px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <i className="ti ti-mood-smile" style={{ fontSize:40, color:"#3b82f6" }} aria-hidden="true"/>
          </div>
          <p>Nenhum registro ainda. Comece registrando como você está agora!</p>
        </div>
      )}
    </div>
  );
}
