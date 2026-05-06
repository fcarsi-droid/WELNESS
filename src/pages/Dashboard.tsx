import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Smile, Moon, Droplets, Utensils, Film, Library, Heart, TrendingUp } from "lucide-react";

const MOODS = [
  { level:"1", emoji:"😞", label:"Péssimo", color:"#ef4444", bg:"#fef2f2" },
  { level:"2", emoji:"😕", label:"Ruim", color:"#f97316", bg:"#fff7ed" },
  { level:"3", emoji:"😐", label:"Ok", color:"#eab308", bg:"#fefce8" },
  { level:"4", emoji:"😊", label:"Bem", color:"#22c55e", bg:"#f0fdf4" },
  { level:"5", emoji:"😄", label:"Ótimo", color:"#3b82f6", bg:"#eff6ff" },
];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function StatCard({ icon, label, value, sub, color, bg, href }: any) {
  return (
    <a href={href} style={{ textDecoration:"none" }}>
      <div className="card" style={{ padding:"1.25rem", cursor:"pointer", transition:"all 0.2s", border:`1px solid ${color}22`, background:bg }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
          <div style={{ width:38, height:38, borderRadius:"0.75rem", background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {icon}
          </div>
          <span style={{ fontSize:"0.78rem", fontWeight:600, color, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
        </div>
        <p style={{ margin:"0 0 0.2rem", fontSize:"1.625rem", fontWeight:700, color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{value}</p>
        {sub && <p style={{ margin:0, fontSize:"0.75rem", color:`${color}99` }}>{sub}</p>}
      </div>
    </a>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tipIndex, setTipIndex] = useState(0);

  const { data: moodHistory = [] } = trpc.mood.history.useQuery({ days: 14 });
  const { data: todayMood } = trpc.mood.today.useQuery();
  const { data: todaySleep } = trpc.sleep.today.useQuery();
  const { data: sleepHistory = [] } = trpc.sleep.history.useQuery({ days: 7 });
  const { data: todayHydration = { glasses: 0, goalGlasses: 8 } } = trpc.hydration.today.useQuery();
  const { data: todayCalories = [] } = trpc.calories.todayEntries.useQuery();
  const { data: calorieGoal = { dailyGoal: 2000 } } = trpc.calories.goal.useQuery();
  const { data: wellnessTips = [] } = trpc.wellness.list.useQuery();

  // Rotate tips every 8 seconds
  useEffect(() => {
    if ((wellnessTips as any[]).length === 0) return;
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % Math.min(3, (wellnessTips as any[]).length));
    }, 8000);
    return () => clearInterval(interval);
  }, [(wellnessTips as any[]).length]);

  const todayMoodData = MOODS.find(m => m.level === todayMood?.level);
  const avgSleep = (sleepHistory as any[]).length > 0
    ? Math.round((sleepHistory as any[]).reduce((a: number, e: any) => a + e.durationMinutes, 0) / (sleepHistory as any[]).length)
    : null;
  const totalCalToday = (todayCalories as any[]).reduce((s: number, e: any) => s + e.calories, 0);
  const hydrationPct = Math.min(100, Math.round(((todayHydration as any).glasses / (todayHydration as any).goalGlasses) * 100));

  // Last 14 days mood for chart
  const moodChartData = [...(moodHistory as any[])].reverse().slice(-14);

  // Random tips selection (3 from wellness resources)
  const tips = (wellnessTips as any[]).length > 0
    ? [0, 1, 2].map(i => (wellnessTips as any[])[(tipIndex + i) % (wellnessTips as any[]).length]).filter(Boolean)
    : [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.875rem" }}>
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>
          {new Intl.DateTimeFormat("pt-BR", { weekday:"long", day:"numeric", month:"long" }).format(new Date())}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:"1rem", marginBottom:"2rem" }}>
        <StatCard
          icon={<Smile size={18} color="#F472B6"/>}
          label="Humor hoje"
          value={todayMoodData ? todayMoodData.emoji : "—"}
          sub={todayMoodData ? todayMoodData.label : "Não registrado"}
          color="#F472B6" bg="#fdf2f8" href="/mood"
        />
        <StatCard
          icon={<Moon size={18} color="#A78BFA"/>}
          label="Sono"
          value={todaySleep ? formatDuration(todaySleep.durationMinutes) : avgSleep ? formatDuration(avgSleep) : "—"}
          sub={todaySleep ? "hoje" : avgSleep ? "média 7 dias" : "Não registrado"}
          color="#A78BFA" bg="#f5f3ff" href="/sleep"
        />
        <StatCard
          icon={<Droplets size={18} color="#60A5FA"/>}
          label="Hidratação"
          value={`${(todayHydration as any).glasses}/${(todayHydration as any).goalGlasses}`}
          sub={`${hydrationPct}% da meta`}
          color="#60A5FA" bg="#eff6ff" href="/hydration"
        />
        <StatCard
          icon={<Utensils size={18} color="#FB923C"/>}
          label="Calorias"
          value={Math.round(totalCalToday).toString()}
          sub={`de ${calorieGoal.dailyGoal} kcal`}
          color="#FB923C" bg="#fff7ed" href="/calories"
        />
      </div>

      {/* Mood chart + wellness tips */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"2rem" }} className="md:grid-cols-2 grid-cols-1">

        {/* Mood chart */}
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <TrendingUp size={16} color="#F472B6"/> Humor — 14 dias
            </h3>
            <a href="/mood" style={{ fontSize:"0.75rem", color:"var(--text-muted)", textDecoration:"none" }}>Ver tudo →</a>
          </div>

          {moodChartData.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
              <p style={{ fontSize:"2rem", margin:"0 0 0.5rem" }}>😊</p>
              Faça check-ins diários para ver seu histórico aqui
            </div>
          ) : (
            <>
              {/* Bar chart */}
              <div style={{ display:"flex", alignItems:"flex-end", gap:"4px", height:80, marginBottom:"0.5rem" }}>
                {moodChartData.map((entry: any, i: number) => {
                  const mood = MOODS.find(m => m.level === entry.level);
                  const h = (parseInt(entry.level) / 5) * 80;
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
                      <div title={`${entry.date}: ${mood?.label}`}
                        style={{ width:"100%", height:h, background:mood?.color, borderRadius:"3px 3px 0 0", opacity:0.85, minWidth:4, transition:"opacity 0.15s", cursor:"default" }}/>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>{moodChartData[0]?.date?.slice(5)}</span>
                <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>Hoje</span>
              </div>

              {/* Mood emoji strip */}
              <div style={{ display:"flex", gap:"2px", marginTop:"0.875rem", flexWrap:"wrap" }}>
                {moodChartData.map((entry: any, i: number) => {
                  const mood = MOODS.find(m => m.level === entry.level);
                  return (
                    <span key={i} title={entry.date} style={{ fontSize:"1.1rem", cursor:"default" }}>{mood?.emoji}</span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Wellness tips */}
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <Heart size={16} color="#F472B6"/> Dicas de Bem-Estar
            </h3>
            <a href="/wellness" style={{ fontSize:"0.75rem", color:"var(--text-muted)", textDecoration:"none" }}>Ver todos →</a>
          </div>

          {tips.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
              <p style={{ fontSize:"2rem", margin:"0 0 0.5rem" }}>💆</p>
              Nenhuma dica ainda. Compartilhe recursos no módulo Bem-Estar!
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {tips.map((tip: any, i: number) => {
                const typeEmoji: Record<string, string> = { article:"📰", video:"🎥", link:"🔗", podcast:"🎙️" };
                return (
                  <a key={tip.id} href={tip.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", textDecoration:"none", padding:"0.75rem", background:"var(--surface-2)", borderRadius:"0.875rem", transition:"all 0.15s" }}
                    onMouseOver={e=>e.currentTarget.style.background="#e8e8e2"}
                    onMouseOut={e=>e.currentTarget.style.background="var(--surface-2)"}
                  >
                    <span style={{ fontSize:"1.25rem", flexShrink:0 }}>{typeEmoji[tip.type] || "🔗"}</span>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:"0 0 0.2rem", fontSize:"0.85rem", fontWeight:600, color:"var(--text)", lineHeight:1.3 }}>{tip.title}</p>
                      {tip.description && <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)", lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>{tip.description}</p>}
                      <p style={{ margin:"0.25rem 0 0", fontSize:"0.7rem", color:"var(--text-muted)" }}>por {tip.userName}</p>
                    </div>
                  </a>
                );
              })}
              {/* Dot indicators */}
              {(wellnessTips as any[]).length > 3 && (
                <div style={{ display:"flex", justifyContent:"center", gap:"0.4rem", marginTop:"0.25rem" }}>
                  {Array.from({ length: Math.min(5, Math.ceil((wellnessTips as any[]).length/3)) }).map((_, i) => (
                    <div key={i} style={{ width:6, height:6, borderRadius:"50%", background: i === Math.floor(tipIndex/3) ? "#F472B6" : "var(--border)", transition:"background 0.3s" }}/>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--text-muted)", margin:"0 0 1rem" }}>
          Acesso rápido
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))", gap:"0.875rem" }}>
          {[
            { label:"Comunidade", icon:"👥", href:"/community", color:"#60A5FA" },
            { label:"Grupos Culturais", icon:"🎬", href:"/cultural", color:"#A78BFA" },
            { label:"Clube da Leitura", icon:"📚", href:"/book-club", color:"#FB923C" },
            { label:"Receitas", icon:"👨‍🍳", href:"/recipes", color:"#2DD4BF" },
            { label:"Bem-Estar", icon:"💆", href:"/wellness", color:"#F472B6" },
            { label:"Relatórios", icon:"📊", href:"/reports", color:"#4CAF82" },
          ].map(item=>(
            <a key={item.href} href={item.href}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.625rem", padding:"1.25rem 0.75rem", background:"white", border:"1px solid var(--border)", borderRadius:"1rem", textDecoration:"none", color:"var(--text)", transition:"all 0.2s ease", cursor:"pointer" }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor=item.color; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 4px 16px ${item.color}22`; }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
            >
              <span style={{ fontSize:"1.625rem" }}>{item.icon}</span>
              <span style={{ fontSize:"0.78rem", fontWeight:500, textAlign:"center", color:"var(--text-muted)" }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
