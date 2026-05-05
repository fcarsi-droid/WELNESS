import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Film, Plus, X, Calendar, MapPin, Users, Star, Heart } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

function Avatar({ name, image, size=32 }: { name?:string|null; image?:string|null; size?:number }) {
  if (image) return <img src={image} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg, #A78BFA, #7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.[0]??""}</div>;
}

export default function CulturalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"groups"|"events">("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<number|null>(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newGroup, setNewGroup] = useState({ name:"", description:"", categoryId:0 });
  const [newEvent, setNewEvent] = useState({ title:"", description:"", location:"", eventDate:"", groupId:undefined as number|undefined });
  const [newPost, setNewPost] = useState({ content:"", title:"", rating:0 });

  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.cultural.getCategories.useQuery();
  const { data: groups = [] } = trpc.cultural.getGroups.useQuery();
  const { data: events = [] } = trpc.cultural.getEvents.useQuery();
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const { data: members = [] } = trpc.cultural.getMembers.useQuery({ groupId: selectedGroupId! }, { enabled: !!selectedGroupId });
  const { data: posts = [] } = trpc.cultural.getPosts.useQuery({ groupId: selectedGroupId! }, { enabled: !!selectedGroupId });

  const createGroup = trpc.cultural.createGroup.useMutation({ onSuccess: () => { utils.cultural.getGroups.invalidate(); setShowNewGroup(false); setNewGroup({name:"",description:"",categoryId:0}); toast.success("Grupo criado!"); } });
  const joinGroup = trpc.cultural.joinGroup.useMutation({ onSuccess: () => { utils.cultural.getMembers.invalidate(); toast.success("Participação atualizada!"); } });
  const createEvent = trpc.cultural.createEvent.useMutation({ onSuccess: () => { utils.cultural.getEvents.invalidate(); setShowNewEvent(false); toast.success("Evento criado!"); } });
  const joinEvent = trpc.cultural.joinEvent.useMutation({ onSuccess: () => utils.cultural.getEventParticipants.invalidate() });
  const createPost = trpc.cultural.createPost.useMutation({ onSuccess: () => { utils.cultural.getPosts.invalidate(); setShowNewPost(false); setNewPost({content:"",title:"",rating:0}); toast.success("Publicado!"); } });
  const likePost = trpc.cultural.likePost.useMutation({ onSuccess: () => utils.cultural.getPosts.invalidate() });

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  if (selectedGroupId && selectedGroup) {
    const isMember = members.some(m => m.userId === user?.id);
    return (
      <div className="fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem" }}>
          <button className="btn-ghost" onClick={() => setSelectedGroupId(null)}>← Voltar</button>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:"0 0 0.1rem", fontSize:"1.5rem" }}>{selectedGroup.name}</h1>
            {selectedGroup.description && <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>{selectedGroup.description}</p>}
          </div>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
            <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}><Users size={13} style={{display:"inline"}}/> {members.length}</span>
            <button className="btn-primary" onClick={() => joinGroup.mutate({ groupId: selectedGroupId })}
              style={{ background: isMember ? "var(--surface-2)" : "linear-gradient(135deg, #A78BFA, #7c3aed)", color: isMember ? "var(--text-muted)" : "white", border: isMember ? "1.5px solid var(--border)" : "none" }}>
              {isMember ? "Sair do grupo" : "Participar"}
            </button>
          </div>
        </div>

        {isMember && (
          <div style={{ marginBottom:"1.25rem" }}>
            {showNewPost ? (
              <div className="card" style={{ padding:"1.25rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  <input value={newPost.title} onChange={e=>setNewPost(f=>({...f,title:e.target.value}))} placeholder="Título (opcional — ex: 'Assisti Oppenheimer')" style={inputStyle}/>
                  <textarea value={newPost.content} onChange={e=>setNewPost(f=>({...f,content:e.target.value}))} placeholder="O que você achou? Compartilhe sua experiência..."
                    style={{...inputStyle, minHeight:100, resize:"vertical"}}/>
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                    <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Avaliação:</span>
                    <div style={{ display:"flex", gap:"0.25rem" }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setNewPost(f=>({...f,rating:f.rating===n?0:n}))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.25rem", color: n<=newPost.rating ? "#FB923C" : "#d1d5db" }}>★</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.875rem" }}>
                  <button className="btn-primary" onClick={() => { if(!newPost.content.trim()) return; createPost.mutate({ groupId:selectedGroupId, ...newPost, rating:newPost.rating||undefined }); }}
                    style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>Publicar</button>
                  <button className="btn-ghost" onClick={() => setShowNewPost(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => setShowNewPost(true)} style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>
                <Plus size={16}/> Nova publicação
              </button>
            )}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {posts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-muted)" }}>
              <p style={{ fontSize:"2rem", margin:"0 0 0.5rem" }}>🎬</p>
              <p>Nenhuma publicação ainda. {isMember ? "Compartilhe algo!" : "Participe para publicar."}</p>
            </div>
          ) : posts.map(p => (
            <div key={p.id} className="card" style={{ padding:"1.25rem" }}>
              <div style={{ display:"flex", gap:"0.75rem", marginBottom:"0.75rem" }}>
                <Avatar name={p.userName} image={p.userImage}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{p.userName}</span>
                    <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{formatRelativeTime(p.createdAt)}</span>
                  </div>
                  {p.title && <p style={{ margin:"0.1rem 0 0", fontWeight:600, fontSize:"0.9rem" }}>{p.title}</p>}
                  {p.rating && <div style={{ display:"flex", gap:"2px", margin:"0.2rem 0" }}>{[1,2,3,4,5].map(n=><span key={n} style={{ color:n<=p.rating!?"#FB923C":"#d1d5db", fontSize:"0.875rem" }}>★</span>)}</div>}
                  <p style={{ margin:"0.4rem 0 0", fontSize:"0.875rem", lineHeight:1.6 }}>{p.content}</p>
                </div>
              </div>
              <button onClick={() => likePost.mutate({ postId: p.id })}
                style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:"var(--text-muted)", padding:0 }}>
                <Heart size={14}/> Curtir
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <Film size={28} color="#A78BFA"/> Grupos Culturais
          </h1>
          <p style={{ margin:0, color:"var(--text-muted)" }}>Filmes, música, teatro, exposições e mais</p>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn-primary" onClick={() => setShowNewGroup(true)} style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>
            <Plus size={16}/> Novo grupo
          </button>
          <button className="btn-ghost" onClick={() => setShowNewEvent(true)}>
            <Calendar size={16}/> Novo evento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.875rem", width:"fit-content", marginBottom:"1.5rem" }}>
        {[["groups","Grupos"],["events","Eventos"]].map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)}
            style={{ padding:"0.5rem 1.25rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans', sans-serif", fontWeight:500, fontSize:"0.875rem", background:activeTab===k?"white":"transparent", color:activeTab===k?"var(--text)":"var(--text-muted)", boxShadow:activeTab===k?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {/* New group form */}
      {showNewGroup && (
        <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans', sans-serif", fontWeight:600 }}>Novo grupo cultural</h3>
            <button className="btn-ghost" onClick={() => setShowNewGroup(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Categoria *</label>
              <select value={newGroup.categoryId} onChange={e=>setNewGroup(f=>({...f,categoryId:parseInt(e.target.value)}))} style={{...inputStyle, background:"white"}}>
                <option value={0}>Selecionar categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Nome do grupo *</label>
              <input value={newGroup.name} onChange={e=>setNewGroup(f=>({...f,name:e.target.value}))} placeholder="Ex: Cinéfilos SP" style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Descrição</label>
              <textarea value={newGroup.description} onChange={e=>setNewGroup(f=>({...f,description:e.target.value}))} placeholder="Sobre o que é esse grupo?" style={{...inputStyle, minHeight:80, resize:"vertical"}}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
            <button className="btn-primary" onClick={() => { if(!newGroup.name||!newGroup.categoryId) return toast.error("Preencha nome e categoria"); createGroup.mutate(newGroup); }}
              style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>Criar grupo</button>
            <button className="btn-ghost" onClick={() => setShowNewGroup(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* New event form */}
      {showNewEvent && (
        <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans', sans-serif", fontWeight:600 }}>Novo evento</h3>
            <button className="btn-ghost" onClick={() => setShowNewEvent(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Título *</label>
              <input value={newEvent.title} onChange={e=>setNewEvent(f=>({...f,title:e.target.value}))} placeholder="Ex: Sessão de cinema" style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Data e hora *</label>
              <input type="datetime-local" value={newEvent.eventDate} onChange={e=>setNewEvent(f=>({...f,eventDate:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Local</label>
              <input value={newEvent.location} onChange={e=>setNewEvent(f=>({...f,location:e.target.value}))} placeholder="Endereço ou link" style={inputStyle}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Grupo (opcional)</label>
              <select value={newEvent.groupId??""} onChange={e=>setNewEvent(f=>({...f,groupId:e.target.value?parseInt(e.target.value):undefined}))} style={{...inputStyle, background:"white"}}>
                <option value="">Sem grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Descrição</label>
              <textarea value={newEvent.description} onChange={e=>setNewEvent(f=>({...f,description:e.target.value}))} style={{...inputStyle, minHeight:70, resize:"vertical"}}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
            <button className="btn-primary" onClick={() => { if(!newEvent.title||!newEvent.eventDate) return toast.error("Preencha título e data"); createEvent.mutate(newEvent); }}>
              Criar evento
            </button>
            <button className="btn-ghost" onClick={() => setShowNewEvent(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {activeTab === "groups" && (
        <div>
          {categories.map(cat => {
            const catGroups = groups.filter(g => g.categoryId === cat.id);
            if (catGroups.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom:"2rem" }}>
                <h2 style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", margin:"0 0 0.875rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  {cat.icon} {cat.name}
                </h2>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:"0.875rem" }}>
                  {catGroups.map(g => (
                    <div key={g.id} className="card" style={{ padding:"1.25rem", cursor:"pointer" }} onClick={() => setSelectedGroupId(g.id)}>
                      <h3 style={{ margin:"0 0 0.375rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.95rem", fontWeight:600 }}>{g.name}</h3>
                      {g.description && <p style={{ margin:"0 0 0.75rem", color:"var(--text-muted)", fontSize:"0.8rem", lineHeight:1.5 }}>{g.description}</p>}
                      <span style={{ fontSize:"0.75rem", color:"#A78BFA", fontWeight:500 }}>Ver grupo →</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {groups.length === 0 && (
            <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
              <p style={{ fontSize:"3rem", margin:"0 0 1rem" }}>🎬</p>
              <p>Nenhum grupo ainda. Crie o primeiro!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "events" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
          {events.length === 0 ? (
            <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
              <p style={{ fontSize:"3rem", margin:"0 0 1rem" }}>📅</p>
              <p>Nenhum evento ainda. Organize o primeiro!</p>
            </div>
          ) : events.map(e => (
            <div key={e.id} className="card" style={{ padding:"1.25rem", display:"flex", gap:"1rem" }}>
              <div style={{ width:52, height:52, borderRadius:"0.875rem", background:"#f5f3ff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:"0.7rem", fontWeight:700, color:"#A78BFA", textTransform:"uppercase" }}>
                  {new Date(e.eventDate).toLocaleDateString("pt-BR",{month:"short"})}
                </span>
                <span style={{ fontSize:"1.25rem", fontWeight:700, color:"#7c3aed", lineHeight:1 }}>
                  {new Date(e.eventDate).getDate()}
                </span>
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ margin:"0 0 0.25rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.95rem", fontWeight:600 }}>{e.title}</h3>
                <div style={{ display:"flex", gap:"1rem", fontSize:"0.8rem", color:"var(--text-muted)", flexWrap:"wrap" }}>
                  <span>{new Date(e.eventDate).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>
                  {e.location && <span style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}><MapPin size={12}/>{e.location}</span>}
                  <span>por {e.userName}</span>
                </div>
                {e.description && <p style={{ margin:"0.4rem 0 0", fontSize:"0.8rem", color:"var(--text-muted)" }}>{e.description}</p>}
              </div>
              <button className="btn-primary" onClick={() => joinEvent.mutate({ eventId: e.id })} style={{ alignSelf:"center", flexShrink:0 }}>
                Participar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
