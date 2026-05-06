import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Film, Plus, X, Calendar, MapPin, Users, Heart, MessageCircle, Send, Trash2, ExternalLink, Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

function Avatar({ name, image, size=32 }: { name?:string|null; image?:string|null; size?:number }) {
  if (image) return <img src={image} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg, #A78BFA, #7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.[0]??""}</div>;
}

function IosIcon({ icon: Icon, color, size=20 }: { icon:any; color:string; size?:number }) {
  return (
    <div style={{ width:size+22, height:size+22, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon size={size} color="white" strokeWidth={2}/>
    </div>
  );
}

function PostCard({ post, userId }: { post:any; userId?:string }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();
  const { data: likes } = trpc.cultural.getPostLikes.useQuery({ postId: post.id });
  const { data: comments = [] } = trpc.cultural.getPostComments.useQuery({ postId: post.id }, { enabled: showComments });
  const like = trpc.cultural.likePost.useMutation({ onSuccess: () => utils.cultural.getPostLikes.invalidate({ postId: post.id }) });
  const addComment = trpc.cultural.addPostComment.useMutation({ onSuccess: () => { utils.cultural.getPostComments.invalidate({ postId: post.id }); setComment(""); } });
  const delComment = trpc.cultural.deletePostComment.useMutation({ onSuccess: () => utils.cultural.getPostComments.invalidate({ postId: post.id }) });

  return (
    <div className="card" style={{ padding:"1.25rem" }}>
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"0.875rem" }}>
        <Avatar name={post.userName} image={post.userImage}/>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{post.userName}</span>
            <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{formatRelativeTime(post.createdAt)}</span>
          </div>
          {post.title && <p style={{ margin:"0.1rem 0 0", fontWeight:600, fontSize:"0.9rem" }}>{post.title}</p>}
          {post.rating && <div style={{ display:"flex", gap:"2px", margin:"0.2rem 0" }}>{[1,2,3,4,5].map(n=><span key={n} style={{ color:n<=post.rating?"#FB923C":"#d1d5db", fontSize:"0.875rem" }}>★</span>)}</div>}
          <p style={{ margin:"0.4rem 0 0", fontSize:"0.875rem", lineHeight:1.6 }}>{post.content}</p>
        </div>
      </div>
      <div style={{ display:"flex", gap:"1rem", paddingTop:"0.75rem", borderTop:"1px solid var(--surface-2)" }}>
        <button onClick={()=>like.mutate({postId:post.id})}
          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:likes?.userLiked?"#F472B6":"var(--text-muted)", fontWeight:likes?.userLiked?600:400, padding:0 }}>
          <Heart size={15} fill={likes?.userLiked?"#F472B6":"none"}/> {likes?.count??0}
        </button>
        <button onClick={()=>setShowComments(v=>!v)}
          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:showComments?"#A78BFA":"var(--text-muted)", padding:0 }}>
          <MessageCircle size={15}/> {(comments as any[]).length > 0 ? (comments as any[]).length : "Comentar"}
        </button>
      </div>
      {showComments && (
        <div style={{ marginTop:"1rem" }}>
          {(comments as any[]).map(c=>(
            <div key={c.id} style={{ display:"flex", gap:"0.625rem", marginBottom:"0.625rem" }}>
              <Avatar name={c.userName} image={c.userImage} size={28}/>
              <div style={{ background:"var(--surface-2)", borderRadius:"0.75rem", padding:"0.5rem 0.75rem", flex:1 }}>
                <span style={{ fontWeight:600, fontSize:"0.75rem", display:"block", marginBottom:"0.2rem" }}>{c.userName}</span>
                <p style={{ margin:0, fontSize:"0.8rem" }}>{c.content}</p>
              </div>
              {c.userId===userId && (
                <button onClick={()=>delComment.mutate({id:c.id})} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:"0.2rem", alignSelf:"center", display:"flex" }}>
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          ))}
          <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.625rem" }}>
            <Avatar name="" size={28}/>
            <div style={{ flex:1, display:"flex", gap:"0.5rem" }}>
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Escreva um comentário..."
                onKeyDown={e=>{ if(e.key==="Enter"&&comment.trim()) addComment.mutate({postId:post.id,content:comment}); }}
                style={{ flex:1, padding:"0.5rem 0.75rem", border:"1.5px solid var(--border)", borderRadius:"99px", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", outline:"none" }}/>
              <button onClick={()=>comment.trim()&&addComment.mutate({postId:post.id,content:comment})}
                style={{ background:"#A78BFA", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"white", flexShrink:0 }}>
                <Send size={14}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, userId, isAdmin }: { event:any; userId?:string; isAdmin:boolean }) {
  const [showDetails, setShowDetails] = useState(false);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();
  const isLink = event.location?.startsWith("http");

  const { data: participants = [] } = trpc.cultural.getEventParticipants.useQuery({ eventId: event.id });
  const { data: comments = [] } = trpc.cultural.getEventComments.useQuery({ eventId: event.id }, { enabled: showDetails });

  const joinEvent = trpc.cultural.joinEvent.useMutation({ onSuccess: () => utils.cultural.getEventParticipants.invalidate({ eventId: event.id }) });
  const deleteEvent = trpc.cultural.deleteEvent.useMutation({ onSuccess: () => { utils.cultural.getEvents.invalidate(); toast.success("Evento removido."); } });
  const addComment = trpc.cultural.addEventComment.useMutation({ onSuccess: () => { utils.cultural.getEventComments.invalidate({ eventId: event.id }); setComment(""); } });
  const delComment = trpc.cultural.deleteEventComment.useMutation({ onSuccess: () => utils.cultural.getEventComments.invalidate({ eventId: event.id }) });

  const isParticipating = (participants as any[]).some(p => p.userId === userId);
  const participantCount = (participants as any[]).length;

  return (
    <div className="card" style={{ padding:"1.25rem" }}>
      <div style={{ display:"flex", gap:"1rem" }}>
        {/* Date badge */}
        <div style={{ width:52, height:52, borderRadius:"0.875rem", background:"#f5f3ff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontSize:"0.6rem", fontWeight:700, color:"#A78BFA", textTransform:"uppercase" }}>
            {new Date(event.eventDate).toLocaleDateString("pt-BR",{month:"short"})}
          </span>
          <span style={{ fontSize:"1.25rem", fontWeight:700, color:"#7c3aed", lineHeight:1 }}>
            {new Date(event.eventDate).getDate()}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ margin:"0 0 0.25rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.95rem", fontWeight:600 }}>{event.title}</h3>
          <div style={{ display:"flex", gap:"0.875rem", fontSize:"0.8rem", color:"var(--text-muted)", flexWrap:"wrap", alignItems:"center" }}>
            <span>{new Date(event.eventDate).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>
            {event.location && (
              isLink ? (
                <a href={event.location} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:"0.3rem", color:"#A78BFA", textDecoration:"none", fontWeight:500 }}>
                  <ExternalLink size={12}/> Acessar link
                </a>
              ) : (
                <span style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <MapPin size={12}/>{event.location}
                </span>
              )
            )}
            <span>por {event.userName}</span>
          </div>
          {event.description && <p style={{ margin:"0.4rem 0 0", fontSize:"0.8rem", color:"var(--text-muted)" }}>{event.description}</p>}

          {/* Participants avatars */}
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.75rem" }}>
            <div style={{ display:"flex" }}>
              {(participants as any[]).slice(0,5).map((p:any, i:number) => (
                <div key={p.id} style={{ marginLeft: i===0?0:-8, zIndex:5-i }}>
                  <Avatar name={p.userName} image={p.userImage} size={24}/>
                </div>
              ))}
            </div>
            <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
              {participantCount === 0 ? "Ninguém confirmou ainda" :
               participantCount === 1 ? "1 pessoa confirmada" :
               `${participantCount} pessoas confirmadas`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", alignItems:"flex-end", flexShrink:0 }}>
          <button onClick={()=>joinEvent.mutate({eventId:event.id})}
            style={{
              padding:"0.5rem 1rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontSize:"0.8rem", fontWeight:600,
              background:isParticipating?"#f0fdf4":"linear-gradient(135deg, #A78BFA, #7c3aed)",
              color:isParticipating?"#16a34a":"white",
              display:"flex", alignItems:"center", gap:"0.3rem",
              transition:"all 0.15s",
            }}>
            {isParticipating ? <><Check size={14}/> Confirmado</> : "Participar"}
          </button>
          <button onClick={()=>setShowDetails(v=>!v)}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:"0.75rem", display:"flex", alignItems:"center", gap:"0.25rem", padding:0 }}>
            <MessageCircle size={13}/> {(comments as any[]).length > 0 ? (comments as any[]).length : ""} {showDetails ? "Fechar" : "Discussão"}
            {showDetails ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          {(event.userId===userId || isAdmin) && (
            <button onClick={()=>{ if(window.confirm("Remover este evento?")) deleteEvent.mutate({id:event.id}); }}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontSize:"0.75rem", display:"flex", alignItems:"center", gap:"0.25rem", padding:0 }}>
              <Trash2 size={13}/> Remover
            </button>
          )}
        </div>
      </div>

      {/* Comments section */}
      {showDetails && (
        <div style={{ marginTop:"1rem", paddingTop:"1rem", borderTop:"1px solid var(--surface-2)" }}>
          <p style={{ margin:"0 0 0.75rem", fontSize:"0.75rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            Discussão do evento
          </p>
          {(comments as any[]).length === 0 && (
            <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", margin:"0 0 0.75rem" }}>Nenhum comentário ainda. Seja o primeiro!</p>
          )}
          {(comments as any[]).map(c=>(
            <div key={c.id} style={{ display:"flex", gap:"0.625rem", marginBottom:"0.625rem" }}>
              <Avatar name={c.userName} image={c.userImage} size={28}/>
              <div style={{ background:"var(--surface-2)", borderRadius:"0.75rem", padding:"0.5rem 0.75rem", flex:1 }}>
                <span style={{ fontWeight:600, fontSize:"0.75rem", display:"block", marginBottom:"0.2rem" }}>{c.userName}</span>
                <p style={{ margin:0, fontSize:"0.8rem" }}>{c.content}</p>
              </div>
              {c.userId===userId && (
                <button onClick={()=>delComment.mutate({id:c.id})} style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", padding:"0.2rem", alignSelf:"center", display:"flex" }}>
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          ))}
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Escreva algo sobre o evento..."
              onKeyDown={e=>{ if(e.key==="Enter"&&comment.trim()) addComment.mutate({eventId:event.id,content:comment}); }}
              style={{ flex:1, padding:"0.5rem 0.75rem", border:"1.5px solid var(--border)", borderRadius:"99px", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", outline:"none" }}/>
            <button onClick={()=>comment.trim()&&addComment.mutate({eventId:event.id,content:comment})}
              style={{ background:"#A78BFA", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"white", flexShrink:0 }}>
              <Send size={14}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CulturalPage() {
  const { user, isAdmin } = useAuth();
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
  const selectedGroup = (groups as any[]).find(g=>g.id===selectedGroupId);
  const { data: members = [] } = trpc.cultural.getMembers.useQuery({ groupId: selectedGroupId! }, { enabled: !!selectedGroupId });
  const { data: posts = [] } = trpc.cultural.getPosts.useQuery({ groupId: selectedGroupId! }, { enabled: !!selectedGroupId });

  const createGroup = trpc.cultural.createGroup.useMutation({ onSuccess: () => { utils.cultural.getGroups.invalidate(); setShowNewGroup(false); setNewGroup({name:"",description:"",categoryId:0}); toast.success("Grupo criado!"); } });
  const joinGroup = trpc.cultural.joinGroup.useMutation({ onSuccess: () => { utils.cultural.getMembers.invalidate(); toast.success("Participação atualizada!"); } });
  const deleteGroup = trpc.cultural.deleteGroup.useMutation({ onSuccess: () => { utils.cultural.getGroups.invalidate(); toast.success("Grupo removido."); } });
  const createEvent = trpc.cultural.createEvent.useMutation({ onSuccess: () => { utils.cultural.getEvents.invalidate(); setShowNewEvent(false); setNewEvent({title:"",description:"",location:"",eventDate:"",groupId:undefined}); toast.success("Evento criado!"); } });
  const createPost = trpc.cultural.createPost.useMutation({ onSuccess: () => { utils.cultural.getPosts.invalidate(); setShowNewPost(false); setNewPost({content:"",title:"",rating:0}); toast.success("Publicado!"); } });

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  // Group detail view
  if (selectedGroupId && selectedGroup) {
    const isMember = (members as any[]).some(m=>m.userId===user?.id);
    return (
      <div className="fade-in">
        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.5rem" }}>
          <button className="btn-ghost" onClick={()=>setSelectedGroupId(null)}>← Voltar</button>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:"0 0 0.1rem", fontSize:"1.5rem" }}>{selectedGroup.name}</h1>
            {selectedGroup.description && <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>{selectedGroup.description}</p>}
          </div>
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
            <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}><Users size={13} style={{display:"inline", verticalAlign:"middle"}}/> {(members as any[]).length}</span>
            <button className="btn-primary" onClick={()=>joinGroup.mutate({groupId:selectedGroupId})}
              style={{ background:isMember?"var(--surface-2)":"linear-gradient(135deg, #A78BFA, #7c3aed)", color:isMember?"var(--text-muted)":"white", border:isMember?"1.5px solid var(--border)":"none" }}>
              {isMember ? "Sair do grupo" : "Participar"}
            </button>
          </div>
        </div>

        {isMember && (
          <div style={{ marginBottom:"1.25rem" }}>
            {showNewPost ? (
              <div className="card" style={{ padding:"1.25rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                  <input value={newPost.title} onChange={e=>setNewPost(f=>({...f,title:e.target.value}))} placeholder="Título (opcional)" style={inputStyle}/>
                  <textarea value={newPost.content} onChange={e=>setNewPost(f=>({...f,content:e.target.value}))} placeholder="O que você achou? Compartilhe sua experiência..."
                    style={{...inputStyle, minHeight:100, resize:"vertical"}}/>
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                    <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Avaliação:</span>
                    <div style={{ display:"flex", gap:"0.25rem" }}>
                      {[1,2,3,4,5].map(n=>(
                        <button key={n} onClick={()=>setNewPost(f=>({...f,rating:f.rating===n?0:n}))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.25rem", color:n<=newPost.rating?"#FB923C":"#d1d5db" }}>★</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.875rem" }}>
                  <button className="btn-primary" onClick={()=>{ if(!newPost.content.trim()) return; createPost.mutate({groupId:selectedGroupId,...newPost,rating:newPost.rating||undefined}); }}
                    style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>Publicar</button>
                  <button className="btn-ghost" onClick={()=>setShowNewPost(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button className="btn-primary" onClick={()=>setShowNewPost(true)} style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>
                <Plus size={16}/> Nova publicação
              </button>
            )}
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {(posts as any[]).length === 0 ? (
            <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-muted)" }}>
              <IosIcon icon={Film} color="#A78BFA" size={24}/>
              <p style={{ marginTop:"0.75rem" }}>Nenhuma publicação ainda. {isMember ? "Compartilhe algo!" : "Participe para publicar."}</p>
            </div>
          ) : (posts as any[]).map(p => <PostCard key={p.id} post={p} userId={user?.id}/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
          <IosIcon icon={Film} color="#A78BFA" size={24}/>
          <div>
            <h1 style={{ margin:"0 0 0.1rem", fontSize:"1.75rem" }}>Grupos Culturais</h1>
            <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>Filmes, música, teatro, exposições e mais</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.5rem" }}>
          <button className="btn-primary" onClick={()=>setShowNewGroup(true)} style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>
            <Plus size={16}/> Novo grupo
          </button>
          <button className="btn-ghost" onClick={()=>setShowNewEvent(true)}>
            <Calendar size={16}/> Novo evento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.875rem", width:"fit-content", marginBottom:"1.5rem" }}>
        {[["groups","Grupos"],["events","Eventos"]].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveTab(k as any)}
            style={{ padding:"0.5rem 1.25rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:"0.875rem", background:activeTab===k?"white":"transparent", color:activeTab===k?"var(--text)":"var(--text-muted)", boxShadow:activeTab===k?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {/* New group form */}
      {showNewGroup && (
        <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Novo grupo cultural</h3>
            <button className="btn-ghost" onClick={()=>setShowNewGroup(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Categoria *</label>
              <select value={newGroup.categoryId} onChange={e=>setNewGroup(f=>({...f,categoryId:parseInt(e.target.value)}))} style={{...inputStyle, background:"white"}}>
                <option value={0}>Selecionar categoria</option>
                {(categories as any[]).map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Nome do grupo *</label>
              <input value={newGroup.name} onChange={e=>setNewGroup(f=>({...f,name:e.target.value}))} placeholder="Ex: Cinéfilos SP" style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Descrição</label>
              <textarea value={newGroup.description} onChange={e=>setNewGroup(f=>({...f,description:e.target.value}))} style={{...inputStyle, minHeight:70, resize:"vertical"}}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
            <button className="btn-primary" onClick={()=>{ if(!newGroup.name||!newGroup.categoryId) return toast.error("Preencha nome e categoria"); createGroup.mutate(newGroup); }}
              style={{ background:"linear-gradient(135deg, #A78BFA, #7c3aed)" }}>Criar grupo</button>
            <button className="btn-ghost" onClick={()=>setShowNewGroup(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* New event form */}
      {showNewEvent && (
        <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Novo evento</h3>
            <button className="btn-ghost" onClick={()=>setShowNewEvent(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Título *</label>
              <input value={newEvent.title} onChange={e=>setNewEvent(f=>({...f,title:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Data e hora *</label>
              <input type="datetime-local" value={newEvent.eventDate} onChange={e=>setNewEvent(f=>({...f,eventDate:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Local ou link</label>
              <input value={newEvent.location} onChange={e=>setNewEvent(f=>({...f,location:e.target.value}))} placeholder="Endereço ou https://..." style={inputStyle}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Grupo (opcional)</label>
              <select value={newEvent.groupId??""} onChange={e=>setNewEvent(f=>({...f,groupId:e.target.value?parseInt(e.target.value):undefined}))} style={{...inputStyle, background:"white"}}>
                <option value="">Sem grupo</option>
                {(groups as any[]).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Descrição</label>
              <textarea value={newEvent.description} onChange={e=>setNewEvent(f=>({...f,description:e.target.value}))} style={{...inputStyle, minHeight:70, resize:"vertical"}}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
            <button className="btn-primary" onClick={()=>{ if(!newEvent.title||!newEvent.eventDate) return toast.error("Preencha título e data"); createEvent.mutate(newEvent); }}>
              Criar evento
            </button>
            <button className="btn-ghost" onClick={()=>setShowNewEvent(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Groups tab */}
      {activeTab==="groups" && (
        <div>
          {(categories as any[]).map(cat=>{
            const catGroups = (groups as any[]).filter(g=>g.categoryId===cat.id);
            if (catGroups.length===0) return null;
            return (
              <div key={cat.id} style={{ marginBottom:"2rem" }}>
                <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--text-muted)", margin:"0 0 0.875rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  {cat.icon} {cat.name}
                </h2>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:"0.875rem" }}>
                  {catGroups.map((g:any)=>(
                    <div key={g.id} className="card" style={{ padding:"1.25rem" }}>
                      <div style={{ cursor:"pointer" }} onClick={()=>setSelectedGroupId(g.id)}>
                        <h3 style={{ margin:"0 0 0.375rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.95rem", fontWeight:600 }}>{g.name}</h3>
                        {g.description && <p style={{ margin:"0 0 0.75rem", color:"var(--text-muted)", fontSize:"0.8rem", lineHeight:1.5 }}>{g.description}</p>}
                        <span style={{ fontSize:"0.75rem", color:"#A78BFA", fontWeight:500 }}>Ver grupo →</span>
                      </div>
                      {isAdmin && (
                        <div style={{ marginTop:"0.75rem", borderTop:"1px solid var(--surface-2)", paddingTop:"0.625rem" }}>
                          <button onClick={e=>{ e.stopPropagation(); if(window.confirm("Remover este grupo?")) deleteGroup.mutate({id:g.id}); }}
                            style={{ background:"none", border:"none", cursor:"pointer", color:"#dc2626", fontSize:"0.75rem", display:"flex", alignItems:"center", gap:"0.3rem", padding:0 }}>
                            <Trash2 size={13}/> Remover grupo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {(groups as any[]).length===0 && (
            <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
              <IosIcon icon={Film} color="#A78BFA" size={28}/>
              <p style={{ marginTop:"1rem" }}>Nenhum grupo ainda. Crie o primeiro!</p>
            </div>
          )}
        </div>
      )}

      {/* Events tab */}
      {activeTab==="events" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {(events as any[]).length===0 ? (
            <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
              <IosIcon icon={Calendar} color="#A78BFA" size={28}/>
              <p style={{ marginTop:"1rem" }}>Nenhum evento ainda. Organize o primeiro!</p>
            </div>
          ) : (events as any[]).map(e=>(
            <EventCard key={e.id} event={e} userId={user?.id} isAdmin={isAdmin}/>
          ))}
        </div>
      )}
    </div>
  );
}
