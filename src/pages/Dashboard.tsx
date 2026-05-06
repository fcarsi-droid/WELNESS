import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Smile, Moon, Droplets, Utensils, Film, Library, Heart, TrendingUp, Users, ChefHat, BarChart2, Calendar, MapPin, BookOpen, Clock } from "lucide-react";

const MOODS = [
  { level:"1", emoji:"😞", label:"Péssimo", color:"#ef4444" },
  { level:"2", emoji:"😕", label:"Ruim", color:"#f97316" },
  { level:"3", emoji:"😐", label:"Ok", color:"#eab308" },
  { level:"4", emoji:"😊", label:"Bem", color:"#22c55e" },
  { level:"5", emoji:"😄", label:"Ótimo", color:"#3b82f6" },
];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function IosIcon({ icon: Icon, color, size=20 }: { icon: any; color: string; size?: number }) {
  return (
    <div style={{ width:size+22, height:size+22, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={size} color="white" strokeWidth={2}/>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, label, value, sub, href }: any) {
  return (
    <a href={href} style={{ textDecoration:"none" }}>
      <div className="card" style={{ padding:"1.25rem", cursor:"pointer" }}
        onMouseOver={e => (e.currentTarget.style.transform="translateY(-2px)")}
        onMouseOut={e => (e.currentTarget.style.transform="none")}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
          <IosIcon icon={Icon} color={iconColor} size={18}/>
          <span style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
        </div>
        <p style={{ margin:"0 0 0.2rem", fontSize:"1.625rem", fontWeight:700, color:"var(--text)", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{value}</p>
        {sub && <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>{sub}</p>}
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
  const { data: todayHydration = { glasses:0, goalGlasses:8 } } = trpc.hydration.today.useQuery();
  const { data: todayCalories = [] } = trpc.calories.todayEntries.useQuery();
  const { data: calorieGoal = { dailyGoal:2000 } } = trpc.calories.goal.useQuery();
  const { data: wellnessTips = [] } = trpc.wellness.list.useQuery();
  const { data: events = [] } = trpc.cultural.getEvents.useQuery();
  const { data: books = [] } = trpc.bookclub.getBooks.useQuery();

  useEffect(() => {
    if ((wellnessTips as any[]).length === 0) return;
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % (wellnessTips as any[]).length);
    }, 8000);
    return () => clearInterval(interval);
  }, [(wellnessTips as any[]).length]);

  const todayMoodData = MOODS.find(m => m.level === todayMood?.level);
  const avgSleep = (sleepHistory as any[]).length > 0
    ? Math.round((sleepHistory as any[]).reduce((a:number,e:any)=>a+e.durationMinutes,0)/(sleepHistory as any[]).length)
    : null;
  const totalCalToday = (todayCalories as any[]).reduce((s:number,e:any)=>s+e.calories,0);
  const hydrationPct = Math.min(100,Math.round(((todayHydration as any).glasses/(todayHydration as any).goalGlasses)*100));
  const moodChartData = [...(moodHistory as any[])].reverse().slice(-14);

  // Upcoming events this week
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7*24*60*60*1000);
  const upcomingEvents = (events as any[]).filter(e => {
    const d = new Date(e.eventDate);
    return d >= now && d <= weekEnd;
  }).sort((a:any,b:any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  // New books (last 7 days)
  const newBooks = (books as any[]).filter(b => {
    const d = new Date(b.createdAt);
    return (now.getTime() - d.getTime()) < 7*24*60*60*1000 && b.status === "available";
  }).slice(0,3);

  // 3 rotating tips
  const tips = (wellnessTips as any[]).length > 0
    ? [0,1,2].map(i=>(wellnessTips as any[])[(tipIndex+i)%(wellnessTips as any[]).length]).filter(Boolean)
    : [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(d);
  };

  const typeEmoji: Record<string,string> = { article:"📰", video:"🎥", link:"🔗", podcast:"🎙️" };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.875rem" }}>
          {greeting()}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>
          {new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(190px, 1fr))", gap:"1rem", marginBottom:"2rem" }}>
        <StatCard icon={Smile} iconColor="#F472B6" label="Humor hoje"
          value={todayMoodData ? todayMoodData.emoji : "—"}
          sub={todayMoodData ? todayMoodData.label : "Não registrado"} href="/mood"/>
        <StatCard icon={Moon} iconColor="#A78BFA" label="Sono"
          value={todaySleep ? formatDuration(todaySleep.durationMinutes) : avgSleep ? formatDuration(avgSleep) : "—"}
          sub={todaySleep ? "hoje" : avgSleep ? "média 7 dias" : "Não registrado"} href="/sleep"/>
        <StatCard icon={Droplets} iconColor="#60A5FA" label="Hidratação"
          value={`${(todayHydration as any).glasses}/${(todayHydration as any).goalGlasses}`}
          sub={`${hydrationPct}% da meta`} href="/hydration"/>
        <StatCard icon={Utensils} iconColor="#FB923C" label="Calorias"
          value={Math.round(totalCalToday).toString()}
          sub={`de ${calorieGoal.dailyGoal} kcal`} href="/calories"/>
      </div>

      {/* Mood chart + events */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
        {/* Mood chart */}
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <IosIcon icon={TrendingUp} color="#F472B6" size={14}/> Humor — 14 dias
            </h3>
            <a href="/mood" style={{ fontSize:"0.75rem", color:"var(--text-muted)", textDecoration:"none" }}>Ver tudo →</a>
          </div>
          {moodChartData.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
              <IosIcon icon={Smile} color="#F472B6" size={24}/>
              <p style={{ marginTop:"0.75rem" }}>Faça check-ins diários para ver seu histórico</p>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"flex-end", gap:"4px", height:80, marginBottom:"0.5rem" }}>
                {moodChartData.map((entry:any, i:number) => {
                  const mood = MOODS.find(m=>m.level===entry.level);
                  const h = (parseInt(entry.level)/5)*80;
                  return (
                    <div key={i} title={`${entry.date}: ${mood?.label}`}
                      style={{ flex:1, height:h, background:mood?.color, borderRadius:"3px 3px 0 0", opacity:0.85, minWidth:4 }}/>
                  );
                })}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>{moodChartData[0]?.date?.slice(5)}</span>
                <span style={{ fontSize:"0.65rem", color:"var(--text-muted)" }}>Hoje</span>
              </div>
              <div style={{ display:"flex", gap:"3px", marginTop:"0.875rem", flexWrap:"wrap" }}>
                {moodChartData.map((entry:any, i:number) => {
                  const mood = MOODS.find(m=>m.level===entry.level);
                  return <span key={i} title={entry.date} style={{ fontSize:"1rem" }}>{mood?.emoji}</span>;
                })}
              </div>
            </>
          )}
        </div>

        {/* Events this week */}
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <IosIcon icon={Calendar} color="#A78BFA" size={14}/> Agenda da semana
            </h3>
            <a href="/cultural" style={{ fontSize:"0.75rem", color:"var(--text-muted)", textDecoration:"none" }}>Ver todos →</a>
          </div>
          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
              <IosIcon icon={Calendar} color="#A78BFA" size={24}/>
              <p style={{ marginTop:"0.75rem" }}>Nenhum evento essa semana</p>
              <a href="/cultural" style={{ fontSize:"0.8rem", color:"#A78BFA", textDecoration:"none", fontWeight:500 }}>+ Criar evento</a>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {upcomingEvents.slice(0,4).map((e:any) => (
                <div key={e.id} style={{ display:"flex", gap:"0.875rem", alignItems:"flex-start" }}>
                  <div style={{ width:40, height:40, borderRadius:"0.75rem", background:"#f5f3ff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"0.6rem", fontWeight:700, color:"#A78BFA", textTransform:"uppercase" }}>
                      {new Date(e.eventDate).toLocaleDateString("pt-BR",{month:"short"})}
                    </span>
                    <span style={{ fontSize:"1rem", fontWeight:700, color:"#7c3aed", lineHeight:1 }}>
                      {new Date(e.eventDate).getDate()}
                    </span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:"0 0 0.1rem", fontWeight:600, fontSize:"0.85rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title}</p>
                    <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                      <Clock size={11}/> {new Date(e.eventDate).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
                      {e.location && <><MapPin size={11}/> {e.location}</>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New books + wellness tips */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", marginBottom:"2rem" }}>
        {/* New books */}
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <IosIcon icon={BookOpen} color="#FB923C" size={14}/> Novos na Biblioteca
            </h3>
            <a href="/book-club" style={{ fontSize:"0.75rem", color:"var(--text-muted)", textDecoration:"none" }}>Ver todos →</a>
          </div>
          {newBooks.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
              <IosIcon icon={BookOpen} color="#FB923C" size={24}/>
              <p style={{ marginTop:"0.75rem" }}>Nenhum livro novo esta semana</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {newBooks.map((b:any) => (
                <div key={b.id} style={{ display:"flex", gap:"0.875rem", alignItems:"center" }}>
                  <div style={{ width:40, height:48, borderRadius:"0.5rem", background:"linear-gradient(135deg, #fff7ed, #ffedd5)", border:"1px solid #fdba74", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"1.1rem" }}>
                    📖
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:"0 0 0.1rem", fontWeight:600, fontSize:"0.85rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.title}</p>
                    <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>por {b.author} · de {b.ownerName}</p>
                  </div>
                  <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#16a34a", background:"#f0fdf4", padding:"0.15rem 0.5rem", borderRadius:"99px", flexShrink:0 }}>Novo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wellness tips */}
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <IosIcon icon={Heart} color="#F472B6" size={14}/> Dicas de Bem-Estar
            </h3>
            <a href="/wellness" style={{ fontSize:"0.75rem", color:"var(--text-muted)", textDecoration:"none" }}>Ver todos →</a>
          </div>
          {tips.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
              <IosIcon icon={Heart} color="#F472B6" size={24}/>
              <p style={{ marginTop:"0.75rem" }}>Compartilhe recursos no módulo Bem-Estar!</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {tips.map((tip:any) => (
                <a key={tip.id} href={tip.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start", textDecoration:"none", padding:"0.75rem", background:"var(--surface-2)", borderRadius:"0.875rem", transition:"background 0.15s" }}
                  onMouseOver={e=>e.currentTarget.style.background="#e8e8e2"}
                  onMouseOut={e=>e.currentTarget.style.background="var(--surface-2)"}>
                  <span style={{ fontSize:"1.125rem", flexShrink:0 }}>{typeEmoji[tip.type]||"🔗"}</span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:"0 0 0.15rem", fontSize:"0.82rem", fontWeight:600, color:"var(--text)", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tip.title}</p>
                    <p style={{ margin:0, fontSize:"0.7rem", color:"var(--text-muted)" }}>por {tip.userName}</p>
                  </div>
                </a>
              ))}
              {(wellnessTips as any[]).length > 3 && (
                <div style={{ display:"flex", justifyContent:"center", gap:"0.4rem" }}>
                  {Array.from({ length: Math.min(5, (wellnessTips as any[]).length) }).map((_,i) => (
                    <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:i===tipIndex%Math.min(5,(wellnessTips as any[]).length)?"#F472B6":"var(--border)", transition:"background 0.3s" }}/>
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
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:"0.875rem" }}>
          {[
            { label:"Comunidade", icon:Users, color:"#60A5FA", href:"/community" },
            { label:"Grupos Culturais", icon:Film, color:"#A78BFA", href:"/cultural" },
            { label:"Clube da Leitura", icon:Library, color:"#FB923C", href:"/book-club" },
            { label:"Receitas", icon:ChefHat, color:"#2DD4BF", href:"/recipes" },
            { label:"Bem-Estar", icon:Heart, color:"#F472B6", href:"/wellness" },
            { label:"Relatórios", icon:BarChart2, color:"#4CAF82", href:"/reports" },
          ].map(item=>(
            <a key={item.href} href={item.href}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.625rem", padding:"1.25rem 0.75rem", background:"white", border:"1px solid var(--border)", borderRadius:"1rem", textDecoration:"none", transition:"all 0.2s ease" }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor=item.color; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 4px 16px ${item.color}22`; }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
              <IosIcon icon={item.icon} color={item.color} size={20}/>
              <span style={{ fontSize:"0.75rem", fontWeight:500, textAlign:"center", color:"var(--text-muted)" }}>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
