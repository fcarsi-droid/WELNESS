import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Heart, Plus, Trash2, Edit2, Check, X, Sparkles, Lightbulb, BookOpen, Settings } from "lucide-react";
import toast from "react-hot-toast";

const TYPE_CONFIG = {
  motivation: { label: "Motivação", icon: Sparkles, color: "#7c3aed", bg: "#f5f3ff" },
  tip: { label: "Dica prática", icon: Lightbulb, color: "#ca8a04", bg: "#fefce8" },
  reflection: { label: "Reflexão", icon: BookOpen, color: "#16a34a", bg: "#f0fdf4" },
};

const DEFAULT_CONTENT = {
  motivation: [
    "Pedir ajuda é um ato de coragem, não de fraqueza.",
    "Você não precisa resolver tudo sozinho.",
    "Cuidar de si mesmo não é egoísmo — é necessidade.",
    "Dias difíceis existem para nos lembrar que somos capazes de superá-los.",
    "Um passo de cada vez. Você está fazendo o suficiente.",
    "Sentir não é fraqueza. É ser humano.",
    "Tempestades passam. A sua também vai.",
    "Você já superou 100% dos seus dias difíceis até aqui.",
    "Não precisa ter tudo resolvido para seguir em frente.",
    "Às vezes descansar já é um grande progresso.",
    "Sua saúde mental importa tanto quanto qualquer outra coisa.",
    "Falar sobre o que sente já é o primeiro passo.",
    "É ok não estar ok. O que importa é não ficar parado nisso.",
    "Cada dia que você cuida de si mesmo conta.",
    "Você merece se sentir bem.",
  ],
  tip: [
    "Saia para uma caminhada de 10 minutos — o movimento físico libera endorfinas.",
    "Escreva 3 coisas, por menores que sejam, que deram certo hoje.",
    "Ligue ou mande mensagem para alguém de confiança.",
    "Beba um copo d'água e respire fundo 5 vezes.",
    "Evite telas por 30 minutos antes de dormir.",
    "Coloque uma música que você gosta e deixe tocar.",
    "Faça uma coisa de cada vez — não tente resolver tudo de uma vez.",
    "Reserve 15 minutos só para você, sem obrigações.",
  ],
  reflection: [
    "Seu histórico de humor é uma ferramenta poderosa. Olhando para os últimos dias, você consegue identificar padrões? Aconteceu algo específico que coincidiu com esse período? O diário de reflexões do app está aqui para te ajudar a entender o que está causando isso — às vezes apenas nomear o que sentimos já traz alívio.",
    "Quando percebemos uma sequência de dias difíceis, vale perguntar: o que mudou recentemente na minha rotina? Sono, alimentação, relações, trabalho? Identificar a raiz é o primeiro passo para mudar.",
    "Seu corpo e mente estão se comunicando com você através desses registros. Que mensagem eles estão tentando passar? Às vezes a resposta está nos padrões que só conseguimos ver quando olhamos de fora.",
  ],
};

export default function WellnessAlertAdmin() {
  const [activeType, setActiveType] = useState<"motivation"|"tip"|"reflection">("motivation");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editContent, setEditContent] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ consecutiveDays:3, percentageThreshold:70, windowDays:7, negativeLevel:2 });

  const utils = trpc.useUtils();
  const { data: content = [] } = trpc.wellnessAlert.getContent.useQuery();
  const { data: savedSettings } = trpc.wellnessAlert.getSettings.useQuery();

  const addContent = trpc.wellnessAlert.addContent.useMutation({ onSuccess: () => { utils.wellnessAlert.getContent.invalidate(); setNewContent(""); toast.success("Conteúdo adicionado!"); } });
  const updateContent = trpc.wellnessAlert.updateContent.useMutation({ onSuccess: () => { utils.wellnessAlert.getContent.invalidate(); setEditingId(null); toast.success("Atualizado!"); } });
  const deleteContent = trpc.wellnessAlert.deleteContent.useMutation({ onSuccess: () => { utils.wellnessAlert.getContent.invalidate(); toast.success("Removido."); } });
  const updateSettings = trpc.wellnessAlert.updateSettings.useMutation({ onSuccess: () => { utils.wellnessAlert.getSettings.invalidate(); setShowSettings(false); toast.success("Configurações salvas!"); } });

  const addDefaultContent = trpc.wellnessAlert.addContent.useMutation({ onSuccess: () => utils.wellnessAlert.getContent.invalidate() });

  async function populateDefaults() {
    for (const [type, items] of Object.entries(DEFAULT_CONTENT)) {
      for (const c of items) {
        await addDefaultContent.mutateAsync({ type: type as any, content: c });
      }
    }
    toast.success("Conteúdo padrão adicionado!");
  }

  const filtered = (content as any[]).filter(c => c.type === activeType);
  const tc = TYPE_CONFIG[activeType];

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg, #7c3aed, #F472B6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Heart size={24} color="white"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:"1.75rem" }}>Auto-monitoramento</h1>
            <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>Configure alertas e conteúdo motivacional</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          {(content as any[]).length === 0 && (
            <button className="btn-ghost" onClick={populateDefaults}>
              <Sparkles size={15}/> Popular conteúdo padrão
            </button>
          )}
          <button className="btn-ghost" onClick={() => { setSettings(savedSettings ?? settings); setShowSettings(v=>!v); }}>
            <Settings size={15}/> Configurações
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.5rem", borderColor:"#7c3aed30", background:"#faf5ff" }}>
          <h3 style={{ margin:"0 0 1.25rem", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:"1rem" }}>⚙️ Critérios para disparar o alerta</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:"1rem", marginBottom:"1.25rem" }}>
            {[
              { key:"consecutiveDays", label:"Dias consecutivos negativos", min:1, max:14, desc:"Quantos dias seguidos com humor negativo para alertar" },
              { key:"percentageThreshold", label:"% de dias negativos", min:10, max:100, desc:`Percentual de dias negativos na janela de tempo` },
              { key:"windowDays", label:"Janela de dias", min:3, max:30, desc:"Quantos dias analisar para calcular o percentual" },
              { key:"negativeLevel", label:"Nível considerado negativo", min:1, max:3, desc:"Humor ≤ este valor é considerado negativo (1=Péssimo, 2=Ruim, 3=Ok)" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>{f.label}</label>
                <input type="number" min={f.min} max={f.max}
                  value={(settings as any)[f.key]}
                  onChange={e => setSettings(s => ({...s, [f.key]: parseInt(e.target.value)||f.min}))}
                  style={{...inputStyle, width:"auto", minWidth:80}}/>
                <p style={{ margin:"0.25rem 0 0", fontSize:"0.7rem", color:"var(--text-muted)", lineHeight:1.4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ padding:"0.875rem 1rem", background:"white", borderRadius:"0.75rem", border:"1px solid #e9d5ff", marginBottom:"1rem", fontSize:"0.8rem", color:"#4a1d96" }}>
            O alerta dispara quando: <strong>{settings.consecutiveDays} dias consecutivos</strong> negativos OU <strong>{settings.percentageThreshold}%</strong> dos últimos <strong>{settings.windowDays} dias</strong> com humor ≤ {settings.negativeLevel}
          </div>
          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button className="btn-primary" onClick={() => updateSettings.mutate(settings)} style={{ background:"linear-gradient(135deg, #7c3aed, #F472B6)" }}>Salvar configurações</button>
            <button className="btn-ghost" onClick={() => setShowSettings(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Content tabs */}
      <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.875rem", width:"fit-content", marginBottom:"1.5rem" }}>
        {Object.entries(TYPE_CONFIG).map(([k, v]) => (
          <button key={k} onClick={() => setActiveType(k as any)}
            style={{ padding:"0.5rem 1.25rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:"0.875rem", background:activeType===k?"white":"transparent", color:activeType===k?"var(--text)":"var(--text-muted)", boxShadow:activeType===k?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s", display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <v.icon size={14}/> {v.label}
            <span style={{ background:activeType===k?v.bg:"transparent", color:v.color, borderRadius:"99px", padding:"0.1rem 0.4rem", fontSize:"0.7rem", fontWeight:700 }}>
              {(content as any[]).filter(c=>c.type===k&&c.isActive).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add new */}
      <div className="card" style={{ padding:"1.25rem", marginBottom:"1.25rem" }}>
        <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>
          Adicionar {tc.label.toLowerCase()}
        </label>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder={`Nova ${tc.label.toLowerCase()}...`}
            style={{...inputStyle, flex:1, minHeight:70, resize:"vertical"}}/>
          <button className="btn-primary" onClick={() => { if(!newContent.trim()) return; addContent.mutate({type:activeType, content:newContent}); }}
            style={{ alignSelf:"flex-end", background:`linear-gradient(135deg, ${tc.color}, ${tc.color}99)` }}>
            <Plus size={16}/>
          </button>
        </div>
      </div>

      {/* Content list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-muted)" }}>
            <p>Nenhum conteúdo de {tc.label.toLowerCase()} ainda.</p>
            {(content as any[]).length === 0 && (
              <button className="btn-ghost" onClick={populateDefaults} style={{ marginTop:"0.75rem" }}>
                <Sparkles size={14}/> Popular com conteúdo padrão
              </button>
            )}
          </div>
        ) : filtered.map((item:any) => (
          <div key={item.id} className="card" style={{ padding:"1rem 1.25rem", opacity:item.isActive?1:0.5, borderLeft:`3px solid ${item.isActive?tc.color:"var(--border)"}` }}>
            {editingId === item.id ? (
              <div style={{ display:"flex", gap:"0.625rem" }}>
                <textarea value={editContent} onChange={e=>setEditContent(e.target.value)}
                  style={{...inputStyle, flex:1, minHeight:60, resize:"vertical"}}/>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                  <button onClick={() => updateContent.mutate({id:item.id, content:editContent, isActive:item.isActive})}
                    style={{ background:"#4CAF82", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", color:"white", display:"flex" }}><Check size={14}/></button>
                  <button onClick={() => setEditingId(null)}
                    style={{ background:"var(--surface-2)", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", display:"flex" }}><X size={14}/></button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                <p style={{ margin:0, flex:1, fontSize:"0.875rem", lineHeight:1.6 }}>{item.content}</p>
                <div style={{ display:"flex", gap:"0.375rem", flexShrink:0 }}>
                  <button onClick={() => updateContent.mutate({id:item.id, content:item.content, isActive:!item.isActive})} title={item.isActive?"Desativar":"Ativar"}
                    style={{ background:item.isActive?"#f0fdf4":"var(--surface-2)", border:"none", borderRadius:"0.5rem", padding:"0.375rem 0.625rem", cursor:"pointer", color:item.isActive?"#16a34a":"var(--text-muted)", fontSize:"0.72rem", fontWeight:500 }}>
                    {item.isActive ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }}
                    style={{ background:"var(--surface-2)", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", display:"flex" }}><Edit2 size={13}/></button>
                  <button onClick={() => deleteContent.mutate({id:item.id})}
                    style={{ background:"#fef2f2", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", color:"#dc2626", display:"flex" }}><Trash2 size={13}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
