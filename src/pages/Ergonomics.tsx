import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Activity, Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import toast from "react-hot-toast";

// Body regions config
const REGIONS: Record<string, { label: string; icon: string; color: string }> = {
  neck:       { label: "Pescoço",        icon: "🦴", color: "#F472B6" },
  shoulders:  { label: "Ombros",         icon: "💪", color: "#A78BFA" },
  upper_back: { label: "Costas (superior)", icon: "🔝", color: "#60A5FA" },
  lower_back: { label: "Lombar",         icon: "⬇️", color: "#FB923C" },
  wrists:     { label: "Punhos/Mãos",   icon: "🤲", color: "#2DD4BF" },
  eyes:       { label: "Olhos",          icon: "👁️", color: "#4CAF82" },
  head:       { label: "Cabeça",         icon: "🧠", color: "#ef4444" },
};

// Ergonomic tips by region
const TIPS: Record<string, string[]> = {
  neck: [
    "Mantenha o monitor na altura dos olhos — o topo da tela deve ficar no nível dos olhos.",
    "Evite inclinar o pescoço para baixo ao usar o celular por longos períodos.",
    "Faça rotações suaves de pescoço a cada hora: 5x para cada lado.",
    "Use suporte para documentos ao lado do monitor para evitar virar o pescoço repetidamente.",
  ],
  shoulders: [
    "Mantenha os ombros relaxados, não elevados. Se estiver com tensão, respire fundo e solte.",
    "Ajuste a cadeira para que os cotovelos fiquem na altura da mesa — 90°.",
    "Evite usar o telefone entre o ombro e o ouvido.",
    "Faça rolamentos de ombro a cada hora: 10x para frente, 10x para trás.",
  ],
  upper_back: [
    "Ajuste o encosto da cadeira para suportar toda a coluna torácica.",
    "Aproxime-se da mesa — não se incline para frente ao digitar.",
    "Exercício: entrelace os dedos atrás da cabeça e abra os cotovelos para trás. 5x por hora.",
    "Verifique se o monitor não está muito longe, forçando você a se inclinar.",
  ],
  lower_back: [
    "Use um suporte lombar ou role uma toalha pequena para apoiar a curva natural da lombar.",
    "Os pés devem estar planos no chão ou em um apoio — não cruzar as pernas.",
    "Levante-se e caminhe por 2 minutos a cada 45 minutos de trabalho sentado.",
    "Inclinação da cadeira: o assento deve estar levemente inclinado para frente (2-3°).",
  ],
  wrists: [
    "Mantenha os pulsos em posição neutra ao digitar — não dobrados para cima ou para baixo.",
    "O mouse deve estar próximo ao teclado, no mesmo nível.",
    "Faça pausas de digitação: abra e feche as mãos 10x a cada hora.",
    "Considere um teclado ergonômico ou um mouse vertical para reduzir a tensão.",
  ],
  eyes: [
    "Regra 20-20-20: a cada 20 minutos, olhe para algo a 6 metros por 20 segundos.",
    "Ajuste o brilho do monitor para ser similar ao ambiente ao redor.",
    "Posicione o monitor a 50-70cm dos olhos — aproximadamente um braço estendido.",
    "Pisque conscientemente — tendemos a piscar menos olhando para telas.",
  ],
  head: [
    "Dor de cabeça frequente pode estar ligada à tensão cervical — verifique a postura.",
    "Hidrate-se: desidratação é uma causa comum de dores de cabeça no trabalho.",
    "Reduza o brilho da tela e ative o modo noturno para diminuir a fadiga.",
    "Faça pausas de 5 minutos a cada hora — saia da frente da tela.",
  ],
};

// Exercises by region
const EXERCISES: Record<string, { name: string; desc: string; reps: string }[]> = {
  neck: [
    { name: "Rotação de pescoço", desc: "Gire lentamente a cabeça para um lado até o limite confortável, segure 3s, volte ao centro e repita no outro lado.", reps: "5x cada lado" },
    { name: "Inclinação lateral", desc: "Incline a cabeça em direção ao ombro esquerdo, mantendo o ombro relaxado. Segure 15s. Repita no outro lado.", reps: "3x cada lado" },
    { name: "Queixo retraído", desc: "Empurre o queixo levemente para trás (como fazer um duplo queixo) e segure 5s. Fortalece a musculatura cervical.", reps: "10x" },
  ],
  shoulders: [
    { name: "Rolamento de ombros", desc: "Role os ombros lentamente para frente em movimento circular. Depois para trás.", reps: "10x cada sentido" },
    { name: "Abrindo o peito", desc: "Entrelace os dedos atrás das costas, estique os braços e abra o peito. Segure 15s.", reps: "3x" },
    { name: "Encolher ombros", desc: "Eleve os dois ombros em direção às orelhas, segure 5s e solte completamente.", reps: "10x" },
  ],
  upper_back: [
    { name: "Abraço cruzado", desc: "Cruze os braços em X na frente do peito como se estivesse se abraçando. Sinta o alongamento entre as escápulas.", reps: "3x, 20s cada" },
    { name: "Abertura de braços", desc: "Estenda os braços para os lados em T, mantendo as palmas para frente. Segure 10s.", reps: "5x" },
    { name: "Torção sentada", desc: "Sentado, gire o tronco para um lado colocando a mão no encosto da cadeira. Segure 15s.", reps: "3x cada lado" },
  ],
  lower_back: [
    { name: "Inclinação pélvica", desc: "Sentado, contraia o abdômen e 'achate' a lombar no encosto da cadeira. Segure 5s e relaxe.", reps: "10x" },
    { name: "Joelho ao peito", desc: "Sentado, segure um joelho com as duas mãos e puxe em direção ao peito. Segure 20s.", reps: "3x cada perna" },
    { name: "Extensão lombar", desc: "Em pé, coloque as mãos na lombar e incline-se levemente para trás. Segure 5s.", reps: "5x" },
  ],
  wrists: [
    { name: "Rotação de pulsos", desc: "Estenda os braços e gire os pulsos em círculos amplos, nos dois sentidos.", reps: "10x cada sentido" },
    { name: "Flexão e extensão", desc: "Com o braço estendido, dobre o pulso para baixo e puxe suavemente com a outra mão. Segure 15s. Depois para cima.", reps: "3x cada posição" },
    { name: "Abre e fecha", desc: "Abra completamente os dedos, segure 3s, feche em punho suave, segure 3s.", reps: "10x" },
  ],
  eyes: [
    { name: "Palming", desc: "Esfregue as palmas das mãos para aquecê-las e coloque-as suavemente sobre os olhos fechados. Respire fundo.", reps: "1min" },
    { name: "Foco distante", desc: "Olhe para o objeto mais distante que conseguir ver e mantenha o foco por 20 segundos.", reps: "A cada 20min" },
    { name: "Piscar consciente", desc: "Pisque lentamente e completamente 20 vezes seguidas. Hidrata os olhos.", reps: "2x por hora" },
  ],
  head: [
    { name: "Pressão nas têmporas", desc: "Coloque os dedos médios nas têmporas e faça movimentos circulares suaves no sentido horário.", reps: "30s" },
    { name: "Massagem no couro cabeludo", desc: "Com as pontas dos dedos, faça movimentos circulares em todo o couro cabeludo.", reps: "1min" },
    { name: "Respiração profunda", desc: "Inspire pelo nariz por 4 segundos, segure 4s, expire pela boca por 6 segundos.", reps: "5x" },
  ],
};

// General ergonomic tips
const GENERAL_TIPS = [
  { icon: "🪑", title: "Postura da cadeira", desc: "Joelhos em 90°, pés no chão, encosto reclinado entre 100-110°, apoio lombar ativo." },
  { icon: "🖥️", title: "Altura do monitor", desc: "Topo da tela na altura dos olhos, a 50-70cm de distância. Use suporte se necessário." },
  { icon: "⌨️", title: "Teclado e mouse", desc: "Cotovelos em 90°, pulsos neutros. Mouse próximo ao corpo, não esticado." },
  { icon: "💡", title: "Iluminação", desc: "Luz natural de lado, não de frente ou atrás da tela. Evite reflexos no monitor." },
  { icon: "⏰", title: "Pausas ativas", desc: "Levante-se a cada 45-60 min. Caminhe, alongue, hidrate-se." },
  { icon: "🏃", title: "Ginástica laboral", desc: "A empresa oferece ginástica laboral! Participe regularmente — previne lesões e melhora o bem-estar." },
];

const BODY_SCORES = [
  { score: 1, label: "Ótimo", color: "#22c55e", bg: "#f0fdf4", emoji: "💪" },
  { score: 2, label: "Bem", color: "#84cc16", bg: "#f7fee7", emoji: "😊" },
  { score: 3, label: "Regular", color: "#eab308", bg: "#fefce8", emoji: "😐" },
  { score: 4, label: "Desconforto", color: "#f97316", bg: "#fff7ed", emoji: "😕" },
  { score: 5, label: "Com dor", color: "#ef4444", bg: "#fef2f2", emoji: "😣" },
];

function IosIcon({ icon: Icon, color, size = 20 }: { icon: any; color: string; size?: number }) {
  return (
    <div style={{ width: size + 22, height: size + 22, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={size} color="white" strokeWidth={2} />
    </div>
  );
}

export default function ErgonomicsPage() {
  const [activeTab, setActiveTab] = useState<"checkin" | "tips" | "exercises">("checkin");
  const [showPainForm, setShowPainForm] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [painIntensity, setPainIntensity] = useState(3);
  const [painNote, setPainNote] = useState("");
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<number | null>(null);
  const [checkinNote, setCheckinNote] = useState("");

  const utils = trpc.useUtils();
  const { data: todayCheckin } = trpc.ergonomics.todayCheckin.useQuery();
  const { data: recentPain = [] } = trpc.ergonomics.getRecentPain.useQuery({ days: 7 });

  const checkin = trpc.ergonomics.checkin.useMutation({
    onSuccess: () => { utils.ergonomics.todayCheckin.invalidate(); toast.success("Check-in registrado!"); setSelectedCheckin(null); setCheckinNote(""); },
  });
  const reportPain = trpc.ergonomics.reportPain.useMutation({
    onSuccess: () => { utils.ergonomics.getRecentPain.invalidate(); setShowPainForm(false); setSelectedRegion(null); setPainNote(""); setPainIntensity(3); toast.success("Dor registrada!"); },
  });
  const deletePain = trpc.ergonomics.deletePain.useMutation({
    onSuccess: () => utils.ergonomics.getRecentPain.invalidate(),
  });

  // Most reported regions this week
  const regionCounts: Record<string, number> = {};
  (recentPain as any[]).forEach(p => { regionCounts[p.region] = (regionCounts[p.region] || 0) + 1; });
  const topRegions = Object.entries(regionCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([r]) => r);

  const todayScore = BODY_SCORES.find(s => s.score === todayCheckin?.bodyScore);
  const inputStyle = { width: "100%", padding: "0.625rem 0.875rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem", fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <IosIcon icon={Activity} color="#4CAF82" size={24} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Ergonomia</h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>Cuide do seu corpo no trabalho</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowPainForm(v => !v)} style={{ background: "linear-gradient(135deg, #4CAF82, #389968)" }}>
          <Plus size={16} /> Registrar desconforto
        </button>
      </div>

      {/* Pain form */}
      {showPainForm && (
        <div className="card fade-in" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderColor: "#fca5a5", background: "#fff5f5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Onde você está sentindo desconforto?</h3>
            <button className="btn-ghost" onClick={() => setShowPainForm(false)} style={{ padding: "0.375rem" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: "0.625rem", marginBottom: "1.25rem" }}>
            {Object.entries(REGIONS).map(([key, r]) => (
              <button key={key} onClick={() => setSelectedRegion(selectedRegion === key ? null : key)}
                style={{ padding: "0.875rem 0.5rem", border: `2px solid ${selectedRegion === key ? r.color : "var(--border)"}`, borderRadius: "0.875rem", background: selectedRegion === key ? r.color + "15" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", transition: "all 0.15s" }}>
                <span style={{ fontSize: "1.5rem" }}>{r.icon}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: selectedRegion === key ? r.color : "var(--text-muted)" }}>{r.label}</span>
              </button>
            ))}
          </div>

          {selectedRegion && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Intensidade da dor
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setPainIntensity(n)}
                      style={{ flex: 1, padding: "0.625rem 0.25rem", border: `2px solid ${painIntensity === n ? "#ef4444" : "var(--border)"}`, borderRadius: "0.75rem", background: painIntensity === n ? "#fef2f2" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", transition: "all 0.15s" }}>
                      <span style={{ fontSize: "1.1rem" }}>{["😌", "🙂", "😐", "😕", "😣"][n - 1]}</span>
                      <span style={{ fontSize: "0.65rem", color: painIntensity === n ? "#ef4444" : "var(--text-muted)", fontWeight: 500 }}>{["Leve", "Moderada", "Regular", "Forte", "Intensa"][n - 1]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>Observação (opcional)</label>
                <textarea value={painNote} onChange={e => setPainNote(e.target.value)} placeholder="Descreva quando começou, o que piora ou melhora..."
                  style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn-primary" onClick={() => reportPain.mutate({ region: selectedRegion as any, intensity: painIntensity, note: painNote || undefined })}
                  disabled={reportPain.isPending} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                  {reportPain.isPending ? "Salvando..." : "Registrar"}
                </button>
                <button className="btn-ghost" onClick={() => setShowPainForm(false)}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", background: "var(--surface-2)", padding: "0.25rem", borderRadius: "0.875rem", width: "fit-content", marginBottom: "1.5rem" }}>
        {[["checkin", "Check-in"], ["tips", "Dicas"], ["exercises", "Exercícios"]].map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.875rem", background: activeTab === k ? "white" : "transparent", color: activeTab === k ? "var(--text)" : "var(--text-muted)", boxShadow: activeTab === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {/* CHECK-IN TAB */}
      {activeTab === "checkin" && (
        <div>
          {/* Today's check-in */}
          <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
              {todayCheckin ? "Seu check-in de hoje" : "Como está seu corpo hoje?"}
            </h3>

            {todayCheckin && !selectedCheckin ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: todayScore?.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.25rem", flexShrink: 0 }}>
                  {todayScore?.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 0.25rem", fontWeight: 600, fontSize: "1.1rem", color: todayScore?.color }}>{todayScore?.label}</p>
                  {todayCheckin.note && <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>{todayCheckin.note}</p>}
                </div>
                <button className="btn-ghost" onClick={() => { setSelectedCheckin(todayCheckin.bodyScore); setCheckinNote(todayCheckin.note ?? ""); }}>
                  Atualizar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                  {BODY_SCORES.map(s => (
                    <button key={s.score} onClick={() => setSelectedCheckin(s.score)}
                      style={{ flex: 1, minWidth: 80, padding: "1rem 0.5rem", border: `2px solid ${selectedCheckin === s.score ? s.color : "var(--border)"}`, borderRadius: "0.875rem", background: selectedCheckin === s.score ? s.bg : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", transition: "all 0.15s" }}>
                      <span style={{ fontSize: "1.75rem" }}>{s.emoji}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 500, color: selectedCheckin === s.score ? s.color : "var(--text-muted)" }}>{s.label}</span>
                    </button>
                  ))}
                </div>
                {selectedCheckin && selectedCheckin >= 3 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.3rem" }}>O que está incomodando? (opcional)</label>
                    <textarea value={checkinNote} onChange={e => setCheckinNote(e.target.value)} placeholder="Descreva o desconforto..."
                      style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} />
                  </div>
                )}
                <button className="btn-primary" onClick={() => { if (!selectedCheckin) return toast.error("Selecione como está seu corpo"); checkin.mutate({ bodyScore: selectedCheckin, note: checkinNote || undefined }); }}
                  disabled={!selectedCheckin || checkin.isPending} style={{ background: "linear-gradient(135deg, #4CAF82, #389968)" }}>
                  {checkin.isPending ? "Salvando..." : "Salvar check-in"}
                </button>
              </>
            )}
          </div>

          {/* Recent pain reports */}
          {(recentPain as any[]).length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 0.875rem" }}>
                Últimos 7 dias
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(recentPain as any[]).map(p => {
                  const r = REGIONS[p.region as keyof typeof REGIONS];
                  return (
                    <div key={p.id} className="card" style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "1.375rem" }}>{r?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{r?.label}</span>
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>intensidade {p.intensity}/5</span>
                        {p.note && <p style={{ margin: "0.1rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.note}</p>}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatRelativeTime(p.createdAt)}</span>
                      <button onClick={() => deletePain.mutate({ id: p.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: "0.2rem", display: "flex" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ginástica laboral reminder */}
          <div style={{ marginTop: "1.5rem", padding: "1.25rem", background: "linear-gradient(135deg, #edfaf3, #f0fdf4)", borderRadius: "1rem", border: "1px solid #86efac" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "2rem", flexShrink: 0 }}>🏃</span>
              <div>
                <p style={{ margin: "0 0 0.375rem", fontWeight: 700, fontSize: "0.95rem", color: "#15803d" }}>Ginástica Laboral</p>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534", lineHeight: 1.6 }}>
                  A empresa oferece ginástica laboral! Participar regularmente previne dores, lesões por esforço repetitivo e melhora seu bem-estar geral. Fique atento às comunicações sobre horários e locais.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIPS TAB */}
      {activeTab === "tips" && (
        <div>
          {/* Personalized tips based on recent pain */}
          {topRegions.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#ef4444", margin: "0 0 0.875rem" }}>
                💡 Dicas personalizadas para você
              </h2>
              {topRegions.map(region => {
                const r = REGIONS[region as keyof typeof REGIONS];
                const tips = TIPS[region] || [];
                const isExpanded = expandedTip === region;
                return (
                  <div key={region} className="card" style={{ padding: "1.25rem", marginBottom: "0.75rem", borderLeft: `3px solid ${r?.color}` }}>
                    <button onClick={() => setExpandedTip(isExpanded ? null : region)}
                      style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "1.375rem" }}>{r?.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{r?.label}</span>
                        <span className="badge" style={{ background: r?.color + "20", color: r?.color, fontSize: "0.65rem" }}>
                          {regionCounts[region]} registro{regionCounts[region] > 1 ? "s" : ""}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </button>
                    {isExpanded && (
                      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                        {tips.map((tip, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.75rem", background: "var(--surface-2)", borderRadius: "0.75rem" }}>
                            <span style={{ color: r?.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                            <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6 }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* General tips */}
          <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 0.875rem" }}>
            Dicas gerais de ergonomia
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "1rem" }}>
            {GENERAL_TIPS.map((tip, i) => (
              <div key={i} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{tip.icon}</span>
                  <div>
                    <p style={{ margin: "0 0 0.375rem", fontWeight: 700, fontSize: "0.875rem" }}>{tip.title}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{tip.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXERCISES TAB */}
      {activeTab === "exercises" && (
        <div>
          {topRegions.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#ef4444", margin: "0 0 0.875rem" }}>
                🎯 Exercícios recomendados para você
              </h2>
              {topRegions.map(region => {
                const r = REGIONS[region as keyof typeof REGIONS];
                const exs = EXERCISES[region] || [];
                return (
                  <div key={region} style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.875rem", fontWeight: 700, margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: r?.color }}>
                      {r?.icon} {r?.label}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {exs.map((ex, i) => (
                        <div key={i} className="card" style={{ padding: "1.25rem", borderLeft: `3px solid ${r?.color}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <h4 style={{ margin: 0, fontFamily: "'DM Sans',sans-serif", fontSize: "0.9rem", fontWeight: 700 }}>{ex.name}</h4>
                            <span className="badge" style={{ background: r?.color + "20", color: r?.color, flexShrink: 0, marginLeft: "0.5rem" }}>{ex.reps}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{ex.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "0 0 0.875rem" }}>
            Todos os exercícios
          </h2>
          {Object.entries(REGIONS).map(([key, r]) => {
            const exs = EXERCISES[key] || [];
            const isExpanded = expandedTip === key + "_ex";
            return (
              <div key={key} className="card" style={{ padding: "1.25rem", marginBottom: "0.75rem" }}>
                <button onClick={() => setExpandedTip(isExpanded ? null : key + "_ex")}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>{r.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{r.label}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{exs.length} exercícios</span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </button>
                {isExpanded && (
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {exs.map((ex, i) => (
                      <div key={i} style={{ padding: "0.875rem", background: "var(--surface-2)", borderRadius: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{ex.name}</span>
                          <span className="badge" style={{ background: r.color + "20", color: r.color, fontSize: "0.65rem" }}>{ex.reps}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{ex.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
