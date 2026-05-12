import { useState, useRef } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../hooks/useAuth";
import { BarChart2, Download, Moon, Smile, Droplets, Utensils, BookOpen } from "lucide-react";

const MOODS = [
  { level:"1", emoji:"😞", label:"Péssimo", color:"#ef4444" },
  { level:"2", emoji:"😕", label:"Ruim", color:"#f97316" },
  { level:"3", emoji:"😐", label:"Ok", color:"#eab308" },
  { level:"4", emoji:"😊", label:"Bem", color:"#22c55e" },
  { level:"5", emoji:"😄", label:"Ótimo", color:"#3b82f6" },
];

function getMood(level: string) { return MOODS.find(m => m.level === level); }
function formatDuration(min: number) { return `${Math.floor(min/60)}h${min%60>0?` ${min%60}min`:""}`; }
function formatDate(str: string) { return new Date(str+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}); }

function IosIcon({ icon: Icon, color, size=20 }: { icon:any; color:string; size?:number }) {
  return (
    <div style={{ width:size+22, height:size+22, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={size} color="white" strokeWidth={2}/>
    </div>
  );
}

// Mini sparkline bar chart
function BarChart({ data, color, height=60, showLabels=false }: { data:{date:string;value:number}[]; color:string; height?:number; showLabels?:boolean }) {
  if (data.length === 0) return <p style={{ color:"var(--text-muted)", fontSize:"0.8rem", textAlign:"center", padding:"1rem" }}>Sem dados</p>;
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:data.length>15?2:3, height, width:"100%" }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:0 }}>
          <div title={`${formatDate(d.date)}: ${d.value}`}
            style={{ width:"100%", height:(d.value/max)*height, background:color, borderRadius:"2px 2px 0 0", opacity:0.85, minHeight:d.value>0?2:0, transition:"height 0.3s" }}/>
          {showLabels && data.length <= 10 && <span style={{ fontSize:"0.6rem", color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(d.date)}</span>}
        </div>
      ))}
    </div>
  );
}

// Mood timeline chart
function MoodChart({ data }: { data:{date:string;level:string}[] }) {
  if (data.length === 0) return <p style={{ color:"var(--text-muted)", fontSize:"0.8rem", textAlign:"center", padding:"1rem" }}>Sem dados</p>;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:data.length>15?2:3, height:80 }}>
        {data.map((d,i)=>{
          const mood = getMood(d.level);
          const h = (parseInt(d.level)/5)*80;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:0 }}>
              <div title={`${formatDate(d.date)}: ${mood?.label}`}
                style={{ width:"100%", height:h, background:mood?.color, borderRadius:"2px 2px 0 0", opacity:0.85 }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>{formatDate(data[0].date)}</span>
        <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>{formatDate(data[data.length-1].date)}</span>
      </div>
      {/* Emoji strip */}
      <div style={{ display:"flex", gap:2, marginTop:8, flexWrap:"wrap" }}>
        {data.map((d,i)=><span key={i} title={`${formatDate(d.date)}: ${getMood(d.level)?.label}`} style={{ fontSize:"0.875rem" }}>{getMood(d.level)?.emoji}</span>)}
      </div>
    </div>
  );
}

// Dual axis: sleep bars + mood dots
function SleepMoodCorrelation({ sleeps, moodByDate }: { sleeps:any[]; moodByDate:Record<string,any> }) {
  if (sleeps.length === 0) return <p style={{ color:"var(--text-muted)", fontSize:"0.8rem", textAlign:"center", padding:"1rem" }}>Sem dados de sono</p>;
  const maxSleep = Math.max(...sleeps.map(s=>s.durationMinutes), 1);

  // Compute correlation insight
  const withBoth = sleeps.filter(s => moodByDate[s.date]);
  let insight = "";
  if (withBoth.length >= 3) {
    const poor = withBoth.filter(s => s.durationMinutes < 360); // < 6h
    const good = withBoth.filter(s => s.durationMinutes >= 420); // >= 7h
    const avgMoodPoor = poor.length > 0 ? poor.reduce((a,s)=>a+parseInt(moodByDate[s.date].level),0)/poor.length : null;
    const avgMoodGood = good.length > 0 ? good.reduce((a,s)=>a+parseInt(moodByDate[s.date].level),0)/good.length : null;
    if (avgMoodPoor !== null && avgMoodGood !== null) {
      if (avgMoodGood > avgMoodPoor + 0.5) {
        insight = `Nos dias com 7h+ de sono, seu humor médio foi ${avgMoodGood.toFixed(1)}/5 — vs ${avgMoodPoor.toFixed(1)}/5 com menos de 6h. Dormir bem faz diferença! 💪`;
      } else {
        insight = `Seu humor se manteve relativamente estável independente das horas de sono. Continue monitorando! 📊`;
      }
    }
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:sleeps.length>15?2:4, height:80 }}>
        {sleeps.map((s,i)=>{
          const mood = moodByDate[s.date];
          const moodData = mood ? getMood(mood.level) : null;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, minWidth:0 }}>
              {moodData && (
                <div title={`Humor: ${moodData.label}`}
                  style={{ width:"100%", height:6, background:moodData.color, borderRadius:"2px", opacity:0.9, marginBottom:1 }}/>
              )}
              <div title={`${formatDate(s.date)}: ${formatDuration(s.durationMinutes)}`}
                style={{ width:"100%", height:(s.durationMinutes/maxSleep)*70, background:"#A78BFA", borderRadius:"2px 2px 0 0", opacity:0.75 }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>{formatDate(sleeps[0].date)}</span>
        <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>{formatDate(sleeps[sleeps.length-1].date)}</span>
      </div>
      <div style={{ display:"flex", gap:"1rem", marginTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:12, borderRadius:2, background:"#A78BFA" }}/><span style={{ fontSize:"0.7rem", color:"var(--text-muted)" }}>Sono</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:6, borderRadius:1, background:"#22c55e" }}/><span style={{ fontSize:"0.7rem", color:"var(--text-muted)" }}>Humor</span></div>
      </div>
      {insight && (
        <div style={{ marginTop:12, padding:"0.75rem 1rem", background:"#eff6ff", borderRadius:"0.75rem", border:"1px solid #bfdbfe", fontSize:"0.8rem", color:"#1d4ed8", lineHeight:1.5 }}>
          {insight}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(30);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.reports.getSummary.useQuery({ days: period });

  async function exportPDF() {
    const { default: html2pdf } = await import("html2pdf.js" as any).catch(() => ({ default: null }));
    if (!html2pdf || !reportRef.current) {
      // Fallback: print
      window.print();
      return;
    }
    html2pdf().set({
      margin: 10,
      filename: `wellness-relatorio-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type:"jpeg", quality:0.98 },
      html2canvas: { scale:2 },
      jsPDF: { unit:"mm", format:"a4", orientation:"portrait" },
    }).from(reportRef.current).save();
  }

  if (isLoading || !data) {
    return (
      <div style={{ textAlign:"center", padding:"4rem", color:"var(--text-muted)" }}>
        <div style={{ width:32, height:32, border:"3px solid var(--border)", borderTopColor:"var(--primary)", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 1rem" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Gerando relatório...
      </div>
    );
  }

  // Process data
  const { moods, sleeps, hydrations, caloriesByDate, calorieGoal, lastMoodByDate } = data;

  // Mood: last entry per day
  const moodByDay = Object.entries(lastMoodByDate as Record<string,any>)
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([date,m])=>({ date, level: m.level }));

  // Sleep by day
  const sleepByDay = [...(sleeps as any[])].sort((a,b)=>a.date.localeCompare(b.date));

  // Hydration hit rate
  const hydDays = hydrations as any[];
  const hydHitDays = hydDays.filter(h=>h.glasses>=h.goalGlasses).length;
  const hydPct = hydDays.length > 0 ? Math.round((hydHitDays/hydDays.length)*100) : 0;

  // Calorie data
  const calData = Object.entries(caloriesByDate as Record<string,number>)
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([date,value])=>({ date, value: Math.round(value) }));
  const avgCal = calData.length > 0 ? Math.round(calData.reduce((a,d)=>a+d.value,0)/calData.length) : 0;

  // Avg sleep
  const avgSleep = sleepByDay.length > 0
    ? Math.round(sleepByDay.reduce((a,s)=>a+s.durationMinutes,0)/sleepByDay.length)
    : 0;

  // Avg mood
  const moodEntries = moods as any[];
  const avgMoodVal = moodEntries.length > 0
    ? moodEntries.reduce((a,m)=>a+parseInt(m.level),0)/moodEntries.length
    : 0;
  const avgMoodEmoji = avgMoodVal > 0 ? getMood(String(Math.round(avgMoodVal)))?.emoji : "—";

  // Reflections with content
  const reflections = moodEntries.filter(m => m.reflection || m.learning)
    .sort((a,b)=>b.date.localeCompare(a.date));

  const cardStyle = { background:"white", border:"1px solid var(--border)", borderRadius:"1rem", padding:"1.5rem", marginBottom:"1rem" };
  const sectionTitle = { fontFamily:"'DM Sans',sans-serif", fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.07em", color:"var(--text-muted)", margin:"0 0 1rem" };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <IosIcon icon={BarChart2} color="#4CAF82" size={24}/>
          <div>
            <h1 style={{ margin:0, fontSize:"1.75rem" }}>Meu Relatório</h1>
            <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>Visão pessoal do seu bem-estar</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.75rem" }}>
            {[7,30,90].map(d=>(
              <button key={d} onClick={()=>setPeriod(d)}
                style={{ padding:"0.4rem 0.875rem", borderRadius:"0.625rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:500, background:period===d?"white":"transparent", color:period===d?"var(--text)":"var(--text-muted)", boxShadow:period===d?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={exportPDF} className="btn-primary" style={{ background:"linear-gradient(135deg, #4CAF82, #389968)" }}>
            <Download size={16}/> Exportar PDF
          </button>
        </div>
      </div>

      {/* Report content */}
      <div ref={reportRef}>
        {/* PDF header */}
        <div style={{ display:"none" }} className="pdf-header">
          <h1 style={{ fontFamily:"'Playfair Display',serif", color:"#4CAF82" }}>Wellness — Relatório Pessoal</h1>
          <p style={{ color:"#666" }}>{user?.name} · {new Date().toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"})} · Últimos {period} dias</p>
          <hr/>
        </div>

        {/* Summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:"1rem", marginBottom:"1.5rem" }}>
          {[
            { icon:Smile, color:"#F472B6", label:"Humor médio", value:avgMoodEmoji||"—", sub:`${avgMoodVal.toFixed(1)}/5` },
            { icon:Moon, color:"#A78BFA", label:"Sono médio", value:avgSleep>0?formatDuration(avgSleep):"—", sub:`${sleepByDay.length} noites` },
            { icon:Droplets, color:"#60A5FA", label:"Meta hidratação", value:`${hydPct}%`, sub:`${hydHitDays}/${hydDays.length} dias` },
            { icon:Utensils, color:"#FB923C", label:"Média calorias", value:avgCal>0?`${avgCal}`:"—", sub:`meta: ${calorieGoal} kcal` },
          ].map(s=>(
            <div key={s.label} style={{ ...cardStyle, marginBottom:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
                <IosIcon icon={s.icon} color={s.color} size={14}/>
                <span style={{ fontSize:"0.72rem", fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</span>
              </div>
              <p style={{ margin:"0 0 0.2rem", fontSize:"1.625rem", fontWeight:700, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{s.value}</p>
              <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Mood chart */}
        <div style={cardStyle}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
            <IosIcon icon={Smile} color="#F472B6" size={16}/>
            <h3 style={sectionTitle}>Humor — últimos {period} dias</h3>
          </div>
          <MoodChart data={moodByDay}/>
          {moodByDay.length === 0 && <p style={{ color:"var(--text-muted)", fontSize:"0.8rem" }}>Nenhum registro de humor neste período.</p>}
        </div>

        {/* Sleep chart */}
        <div style={cardStyle}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
            <IosIcon icon={Moon} color="#A78BFA" size={16}/>
            <h3 style={sectionTitle}>Sono — horas dormidas</h3>
          </div>
          <BarChart
            data={sleepByDay.map(s=>({ date:s.date, value:Math.round(s.durationMinutes/60*10)/10 }))}
            color="#A78BFA"
            height={80}
          />
          {sleepByDay.length > 0 && (
            <div style={{ display:"flex", gap:"1.5rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
              {[
                { label:"Média", value:formatDuration(avgSleep) },
                { label:"Melhor noite", value:formatDuration(Math.max(...sleepByDay.map(s=>s.durationMinutes))) },
                { label:"Menor noite", value:formatDuration(Math.min(...sleepByDay.map(s=>s.durationMinutes))) },
                { label:"Noites ≥ 7h", value:`${sleepByDay.filter(s=>s.durationMinutes>=420).length}/${sleepByDay.length}` },
              ].map(s=>(
                <div key={s.label}>
                  <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>{s.label}</p>
                  <p style={{ margin:0, fontWeight:700, fontSize:"0.875rem" }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sleep × Mood correlation */}
        {sleepByDay.length > 0 && moodByDay.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
              <div style={{ display:"flex" }}>
                <IosIcon icon={Moon} color="#A78BFA" size={14}/>
                <div style={{ marginLeft:-8 }}><IosIcon icon={Smile} color="#F472B6" size={14}/></div>
              </div>
              <h3 style={sectionTitle}>Correlação Sono × Humor</h3>
            </div>
            <SleepMoodCorrelation sleeps={sleepByDay} moodByDate={lastMoodByDate as any}/>
          </div>
        )}

        {/* Hydration */}
        {hydDays.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
              <IosIcon icon={Droplets} color="#60A5FA" size={16}/>
              <h3 style={sectionTitle}>Hidratação</h3>
            </div>
            <div style={{ display:"flex", gap:"1rem", alignItems:"center", marginBottom:"1rem" }}>
              <div style={{ flex:1 }}>
                <div style={{ background:"var(--surface-2)", borderRadius:"99px", height:12, overflow:"hidden" }}>
                  <div style={{ width:`${hydPct}%`, height:"100%", background:"linear-gradient(90deg, #60A5FA, #2563eb)", borderRadius:"99px", transition:"width 0.5s" }}/>
                </div>
              </div>
              <span style={{ fontWeight:700, fontSize:"1.25rem", color:"#2563eb", flexShrink:0 }}>{hydPct}%</span>
            </div>
            <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-muted)" }}>
              Meta batida em {hydHitDays} de {hydDays.length} dias registrados
            </p>
          </div>
        )}

        {/* Calories */}
        {calData.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
              <IosIcon icon={Utensils} color="#FB923C" size={16}/>
              <h3 style={sectionTitle}>Calorias diárias</h3>
            </div>
            <BarChart data={calData} color="#FB923C" height={80}/>
            <div style={{ display:"flex", gap:"1.5rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
              {[
                { label:"Média", value:`${avgCal} kcal` },
                { label:"Meta", value:`${calorieGoal} kcal` },
                { label:"Dias abaixo da meta", value:`${calData.filter(d=>d.value<=calorieGoal).length}/${calData.length}` },
              ].map(s=>(
                <div key={s.label}>
                  <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>{s.label}</p>
                  <p style={{ margin:0, fontWeight:700, fontSize:"0.875rem" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflections diary */}
        {reflections.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
              <IosIcon icon={BookOpen} color="#4CAF82" size={16}/>
              <h3 style={sectionTitle}>Diário de reflexões</h3>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {reflections.map((m:any) => {
                const mood = getMood(m.level);
                return (
                  <div key={m.id} style={{ padding:"1rem", background:"var(--surface-2)", borderRadius:"0.875rem", borderLeft:`3px solid ${mood?.color}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.625rem" }}>
                      <span style={{ fontSize:"1.25rem" }}>{mood?.emoji}</span>
                      <div>
                        <span style={{ fontWeight:600, fontSize:"0.875rem", color:mood?.color }}>{mood?.label}</span>
                        <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginLeft:"0.5rem" }}>
                          {new Date(m.date+"T12:00:00").toLocaleDateString("pt-BR",{day:"numeric",month:"long"})}
                          {m.time ? ` às ${m.time}` : ""}
                        </span>
                      </div>
                    </div>
                    {m.note && <p style={{ margin:"0 0 0.5rem", fontSize:"0.8rem", color:"var(--text-muted)", fontStyle:"italic" }}>"{m.note}"</p>}
                    {m.reflection && (
                      <div style={{ marginBottom:"0.5rem" }}>
                        <p style={{ margin:"0 0 0.2rem", fontSize:"0.7rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.04em" }}>O que aconteceu</p>
                        <p style={{ margin:0, fontSize:"0.8rem", lineHeight:1.5 }}>{m.reflection}</p>
                      </div>
                    )}
                    {m.learning && (
                      <div>
                        <p style={{ margin:"0 0 0.2rem", fontSize:"0.7rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.04em" }}>O que aprendi sobre mim</p>
                        <p style={{ margin:0, fontSize:"0.8rem", lineHeight:1.5 }}>{m.learning}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {moodByDay.length===0 && sleepByDay.length===0 && hydDays.length===0 && calData.length===0 && (
          <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
            <IosIcon icon={BarChart2} color="#4CAF82" size={28}/>
            <p style={{ marginTop:"1rem" }}>Nenhum dado registrado nos últimos {period} dias.</p>
            <p style={{ fontSize:"0.875rem" }}>Comece registrando seu humor, sono e hidratação!</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .btn-primary, button { display: none !important; }
          .pdf-header { display: block !important; }
          .card { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
