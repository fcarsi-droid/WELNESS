import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Heart, Plus, X, ExternalLink } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const TYPE_CONFIG = {
  article: { label:"Artigo", icon:"ti-article", color:"#60A5FA", bg:"#eff6ff" },
  video: { label:"Vídeo", icon:"ti-player-play", color:"#F472B6", bg:"#fdf2f8" },
  link: { label:"Link", icon:"ti-link", color:"#4CAF82", bg:"#edfaf3" },
  podcast: { label:"Podcast", icon:"ti-microphone", color:"#A78BFA", bg:"#f5f3ff" },
};

export default function WellnessPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", url:"", description:"", type:"article" as keyof typeof TYPE_CONFIG });
  const [filter, setFilter] = useState("all");

  const utils = trpc.useUtils();
  const { data: resources = [] } = trpc.wellness.list.useQuery();
  const create = trpc.wellness.create.useMutation({
    onSuccess: () => { utils.wellness.list.invalidate(); setShowForm(false); setForm({ title:"", url:"", description:"", type:"article" }); toast.success("Recurso compartilhado!"); },
  });
  const del = trpc.wellness.delete.useMutation({ onSuccess: () => utils.wellness.list.invalidate() });
  const like = trpc.wellness.like.useMutation({ onSuccess: () => utils.wellness.list.invalidate() });

  const filtered = filter==="all" ? resources : resources.filter((r:any) => r.type===filter);
  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <div style={{ width:48, height:48, borderRadius:"50%", background:"#F472B6", display:"flex", alignItems:"center", justifyContent:"center" }}><Heart size={24} color="white"/></div> Bem-Estar
          </h1>
          <p style={{ margin:0, color:"var(--text-muted)" }}>Recursos compartilhados pela equipe</p>
        </div>
        <button className="btn-primary" onClick={()=>setShowForm(v=>!v)} style={{ background:"linear-gradient(135deg, #F472B6, #ec4899)" }}>
          <Plus size={16}/> Compartilhar
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {[["all","Todos","ti-sparkles"], ...Object.entries(TYPE_CONFIG).map(([k,v])=>[k,v.label,v.icon])].map(([key,label,icon])=>(
          <button key={key} onClick={()=>setFilter(key)}
            style={{ padding:"0.4rem 0.875rem", border:`2px solid ${filter===key?"#F472B6":"var(--border)"}`, borderRadius:"99px", background:filter===key?"#fdf2f8":"white", cursor:"pointer", fontSize:"0.8rem", fontWeight:500, color:filter===key?"#ec4899":"var(--text-muted)", transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:5 }}>
            <i className={`ti ${icon}`} style={{ fontSize:14 }} aria-hidden="true"/>{label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card fade-in" style={{ padding:"1.75rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Compartilhar recurso</h3>
            <button className="btn-ghost" onClick={()=>setShowForm(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Tipo</label>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                {Object.entries(TYPE_CONFIG).map(([k,v])=>(
                  <button key={k} onClick={()=>setForm(f=>({...f,type:k as any}))}
                    style={{ padding:"0.4rem 0.875rem", border:`2px solid ${form.type===k?v.color:"var(--border)"}`, borderRadius:"99px", background:form.type===k?v.bg:"white", cursor:"pointer", fontSize:"0.8rem", fontWeight:500, color:form.type===k?v.color:"var(--text-muted)" }}>
                    <i className={`ti ${v.icon}`} style={{ fontSize:14, verticalAlign:-2, marginRight:5 }} aria-hidden="true"/>{v.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Título *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Nome do recurso" style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>URL *</label>
              <input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://..." style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Descrição</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Sobre o que é? Por que você recomenda?" style={{...inputStyle, minHeight:80, resize:"vertical"}}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
            <button className="btn-primary" onClick={()=>{ if(!form.title||!form.url) return toast.error("Preencha título e URL"); create.mutate(form); }} disabled={create.isPending} style={{ background:"linear-gradient(135deg, #F472B6, #ec4899)" }}>
              {create.isPending ? "Compartilhando..." : "Compartilhar"}
            </button>
            <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Resources */}
      {(filtered as any[]).length===0 ? (
        <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#F472B6", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}><i className="ti ti-bulb" style={{ fontSize:36, color:"white" }} aria-hidden="true"/></div>
          <p>Nenhum recurso ainda. Compartilhe algo que te ajudou!</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
          {(filtered as any[]).map(r=>{
            const t = TYPE_CONFIG[r.type as keyof typeof TYPE_CONFIG];
            return (
              <div key={r.id} className="card" style={{ padding:"1.25rem" }}>
                <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                  <div style={{ width:44, height:44, borderRadius:"0.875rem", background:t.bg, border:`1px solid ${t.color}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><i className={`ti ${t.icon}`} style={{ fontSize:22, color:t.color }} aria-hidden="true"/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.5rem", marginBottom:"0.3rem" }}>
                      <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.95rem", fontWeight:600 }}>{r.title}</h3>
                      <span className="badge" style={{ background:t.bg, color:t.color, flexShrink:0 }}>{t.label}</span>
                    </div>
                    {r.description && <p style={{ margin:"0 0 0.5rem", color:"var(--text-muted)", fontSize:"0.8rem", lineHeight:1.5 }}>{r.description}</p>}
                    <div style={{ display:"flex", gap:"1rem", alignItems:"center", flexWrap:"wrap" }}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.8rem", color:t.color, textDecoration:"none", fontWeight:500 }}>
                        <ExternalLink size={13}/> Acessar
                      </a>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                        por <strong>{r.userName}</strong>
                      </span>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginLeft:"auto" }}>{formatRelativeTime(r.createdAt)}</span>
                      {r.userId === user?.id && (
                        <button onClick={()=>del.mutate({id:r.id})} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:0, display:"flex" }}>
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
