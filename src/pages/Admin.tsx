import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Settings, Check, X, Shield, UserX, Trash2, Users, FileText, Book, Heart, Film, BookOpen } from "lucide-react";
import { formatDate, formatRelativeTime } from "../lib/utils";
import toast from "react-hot-toast";

function Avatar({ name, image, size=36 }: { name?:string|null; image?:string|null; size?:number }) {
  if (image) return <img src={image} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg, #64748b, #475569)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.[0]??""}</div>;
}

const statusConfig: Record<string, { label:string; bg:string; color:string }> = {
  pending: { label:"Pendente", bg:"#fefce8", color:"#ca8a04" },
  active: { label:"Ativo", bg:"#f0fdf4", color:"#16a34a" },
  banned: { label:"Suspenso", bg:"#fef2f2", color:"#dc2626" },
};

const loanStatusConfig: Record<string, { label:string; color:string }> = {
  requested: { label:"Solicitado", color:"#ca8a04" },
  active: { label:"Em andamento", color:"#2563eb" },
  returned: { label:"Devolvido", color:"#16a34a" },
  cancelled: { label:"Cancelado", color:"#dc2626" },
};

type Tab = "users"|"community"|"wellness"|"cultural"|"bookclub"|"loans";

function DeleteBtn({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div style={{ display:"flex", gap:"0.25rem", alignItems:"center", flexShrink:0 }}>
      <span style={{ fontSize:"0.7rem", color:"#dc2626", fontWeight:500 }}>Confirmar?</span>
      <button onClick={onDelete} style={{ background:"#dc2626", border:"none", borderRadius:"0.5rem", padding:"0.3rem 0.5rem", cursor:"pointer", color:"white", fontSize:"0.7rem", fontWeight:600 }}>Sim</button>
      <button onClick={() => setConfirm(false)} style={{ background:"var(--surface-2)", border:"none", borderRadius:"0.5rem", padding:"0.3rem 0.5rem", cursor:"pointer", fontSize:"0.7rem" }}>Não</button>
    </div>
  );
  return (
    <button onClick={() => setConfirm(true)} style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"0.5rem", padding:"0.375rem 0.625rem", cursor:"pointer", color:"#dc2626", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.75rem", fontWeight:500, flexShrink:0 }}>
      <Trash2 size={13}/> Apagar
    </button>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const utils = trpc.useUtils();

  const { data: pending = [] } = trpc.admin.getPendingUsers.useQuery();
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery();
  const { data: allPosts = [] } = trpc.admin.getAllPosts.useQuery();
  const { data: allComments = [] } = trpc.admin.getAllComments.useQuery();
  const { data: allResources = [] } = trpc.admin.getAllWellnessResources.useQuery();
  const { data: allCulturalPosts = [] } = trpc.admin.getAllCulturalPosts.useQuery();
  const { data: allReviews = [] } = trpc.admin.getAllReviews.useQuery();
  const { data: allBooks = [] } = trpc.admin.getAllBooks.useQuery();
  const { data: allLoans = [] } = trpc.admin.getAllLoans.useQuery();

  const approve = trpc.admin.approveUser.useMutation({ onSuccess: () => { utils.admin.getPendingUsers.invalidate(); utils.admin.getAllUsers.invalidate(); toast.success("Aprovado!"); } });
  const ban = trpc.admin.banUser.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Suspenso."); } });
  const reactivate = trpc.admin.reactivateUser.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Reativado!"); } });
  const promote = trpc.admin.promoteToAdmin.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Promovido a admin!"); } });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Usuário removido."); } });
  const deletePost = trpc.admin.deletePost.useMutation({ onSuccess: () => utils.admin.getAllPosts.invalidate() });
  const deleteComment = trpc.admin.deleteComment.useMutation({ onSuccess: () => utils.admin.getAllComments.invalidate() });
  const deleteResource = trpc.admin.deleteWellnessResource.useMutation({ onSuccess: () => utils.admin.getAllWellnessResources.invalidate() });
  const deleteCulturalPost = trpc.admin.deleteCulturalPost.useMutation({ onSuccess: () => utils.admin.getAllCulturalPosts.invalidate() });
  const deleteReview = trpc.admin.deleteReview.useMutation({ onSuccess: () => utils.admin.getAllReviews.invalidate() });
  const deleteBook = trpc.admin.deleteBook.useMutation({ onSuccess: () => utils.admin.getAllBooks.invalidate() });
  const deleteLoan = trpc.admin.deleteLoan.useMutation({ onSuccess: () => utils.admin.getAllLoans.invalidate() });

  const tabs: { key:Tab; label:string; icon:any; count?:number }[] = [
    { key:"users", label:"Usuários", icon:Users, count:pending.length||undefined },
    { key:"community", label:"Comunidade", icon:FileText },
    { key:"wellness", label:"Bem-Estar", icon:Heart },
    { key:"cultural", label:"Cultural", icon:Film },
    { key:"bookclub", label:"Clube da Leitura", icon:Book },
    { key:"loans", label:"Empréstimos", icon:BookOpen },
  ];

  const sectionLabel = (text: string) => (
    <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--text-muted)", margin:"0 0 0.875rem" }}>{text}</h2>
  );

  return (
    <div className="fade-in" style={{ maxWidth:900, margin:"0 auto" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <Settings size={28} color="#64748b"/> Administração
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>Gerencie usuários, conteúdo e biblioteca</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"2rem" }}>
        {[
          { label:"Aguardando aprovação", value:(pending as any[]).length, color:"#ca8a04", bg:"#fefce8" },
          { label:"Usuários ativos", value:(allUsers as any[]).filter((u:any)=>u.status==="active").length, color:"#16a34a", bg:"#f0fdf4" },
          { label:"Total de membros", value:(allUsers as any[]).length+1, color:"#64748b", bg:"var(--surface-2)" },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:"1.25rem", textAlign:"center", background:s.bg, borderColor:s.color+"30" }}>
            <p style={{ margin:"0 0 0.25rem", fontSize:"2rem", fontWeight:700, color:s.color, fontFamily:"'Playfair Display',serif" }}>{s.value}</p>
            <p style={{ margin:0, fontSize:"0.72rem", color:s.color, fontWeight:500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.875rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ padding:"0.5rem 0.875rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:"0.8rem", background:tab===t.key?"white":"transparent", color:tab===t.key?"var(--text)":"var(--text-muted)", boxShadow:tab===t.key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s", display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <t.icon size={14}/>{t.label}
            {t.count ? <span style={{ background:"#ca8a04", color:"white", borderRadius:"99px", padding:"0.05rem 0.4rem", fontSize:"0.65rem", fontWeight:700 }}>{t.count}</span> : null}
          </button>
        ))}
      </div>

      {/* USERS */}
      {tab==="users" && (
        <div>
          {(pending as any[]).length > 0 && (
            <div style={{ marginBottom:"2rem" }}>
              {sectionLabel(`⏳ Aguardando aprovação (${(pending as any[]).length})`)}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                {(pending as any[]).map(u=>(
                  <div key={u.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", borderColor:"#fde68a", background:"#fefce8" }}>
                    <Avatar name={u.name} image={u.image}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{u.name}</p>
                      <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>{u.email} · {formatDate(u.createdAt)}</p>
                    </div>
                    <button onClick={()=>approve.mutate({userId:u.id})} style={{ display:"flex", alignItems:"center", gap:"0.3rem", padding:"0.4rem 0.875rem", background:"#4CAF82", color:"white", border:"none", borderRadius:"0.625rem", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 }}>
                      <Check size={14}/> Aprovar
                    </button>
                    <button onClick={()=>ban.mutate({userId:u.id})} style={{ display:"flex", alignItems:"center", gap:"0.3rem", padding:"0.4rem 0.75rem", background:"white", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:"0.625rem", cursor:"pointer", fontSize:"0.8rem" }}>
                      <X size={14}/> Recusar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sectionLabel("Todos os membros")}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(allUsers as any[]).map(u=>{
              const sc = statusConfig[u.status];
              return (
                <div key={u.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"0.875rem" }}>
                  <Avatar name={u.name} image={u.image}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{u.name}</p>
                      {u.role==="admin" && <span className="badge" style={{ background:"#eff6ff", color:"#2563eb", fontSize:"0.62rem" }}>Admin</span>}
                    </div>
                    <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>{u.email} · desde {formatDate(u.createdAt)}</p>
                  </div>
                  <span className="badge" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                  <div style={{ display:"flex", gap:"0.375rem" }}>
                    {u.status==="active" && u.role!=="admin" && (
                      <button onClick={()=>promote.mutate({userId:u.id})} title="Promover a admin" style={{ background:"#eff6ff", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", color:"#2563eb", display:"flex" }}><Shield size={14}/></button>
                    )}
                    {u.status==="active" && (
                      <button onClick={()=>ban.mutate({userId:u.id})} title="Suspender" style={{ background:"#fef2f2", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", color:"#dc2626", display:"flex" }}><UserX size={14}/></button>
                    )}
                    {u.status==="banned" && (
                      <button onClick={()=>reactivate.mutate({userId:u.id})} style={{ background:"#f0fdf4", border:"none", borderRadius:"0.5rem", padding:"0.375rem 0.625rem", cursor:"pointer", color:"#16a34a", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.75rem", fontWeight:500 }}>
                        <Check size={13}/> Reativar
                      </button>
                    )}
                    {u.status==="pending" && (
                      <button onClick={()=>approve.mutate({userId:u.id})} style={{ background:"#f0fdf4", border:"none", borderRadius:"0.5rem", padding:"0.375rem 0.625rem", cursor:"pointer", color:"#16a34a", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.75rem", fontWeight:500 }}>
                        <Check size={13}/> Aprovar
                      </button>
                    )}
                    <DeleteBtn onDelete={()=>deleteUser.mutate({userId:u.id})}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMMUNITY */}
      {tab==="community" && (
        <div>
          {sectionLabel(`Posts (${(allPosts as any[]).length})`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1.5rem" }}>
            {(allPosts as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum post.</p>}
            {(allPosts as any[]).map(p=>(
              <div key={p.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 0.3rem", fontSize:"0.72rem", color:"var(--text-muted)" }}><strong>{p.userName}</strong> · {formatRelativeTime(p.createdAt)}</p>
                  <p style={{ margin:0, fontSize:"0.875rem" }}>{p.content.slice(0,150)}{p.content.length>150?"...":""}</p>
                </div>
                <DeleteBtn onDelete={()=>deletePost.mutate({id:p.id})}/>
              </div>
            ))}
          </div>
          {sectionLabel(`Comentários (${(allComments as any[]).length})`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(allComments as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum comentário.</p>}
            {(allComments as any[]).map(c=>(
              <div key={c.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 0.3rem", fontSize:"0.72rem", color:"var(--text-muted)" }}><strong>{c.userName}</strong> · {formatRelativeTime(c.createdAt)}</p>
                  <p style={{ margin:0, fontSize:"0.875rem" }}>{c.content}</p>
                </div>
                <DeleteBtn onDelete={()=>deleteComment.mutate({id:c.id})}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WELLNESS */}
      {tab==="wellness" && (
        <div>
          {sectionLabel(`Recursos de Bem-Estar (${(allResources as any[]).length})`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(allResources as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum recurso.</p>}
            {(allResources as any[]).map(r=>(
              <div key={r.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"center" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 0.1rem", fontWeight:600, fontSize:"0.875rem" }}>{r.title}</p>
                  <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>{r.userName} · {r.type} · {formatRelativeTime(r.createdAt)}</p>
                </div>
                <DeleteBtn onDelete={()=>deleteResource.mutate({id:r.id})}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CULTURAL */}
      {tab==="cultural" && (
        <div>
          {sectionLabel(`Posts Culturais (${(allCulturalPosts as any[]).length})`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(allCulturalPosts as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum post.</p>}
            {(allCulturalPosts as any[]).map(p=>(
              <div key={p.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 0.3rem", fontSize:"0.72rem", color:"var(--text-muted)" }}><strong>{p.userName}</strong> · {formatRelativeTime(p.createdAt)}</p>
                  {p.title && <p style={{ margin:"0 0 0.2rem", fontWeight:600, fontSize:"0.875rem" }}>{p.title}</p>}
                  <p style={{ margin:0, fontSize:"0.875rem" }}>{p.content.slice(0,150)}{p.content.length>150?"...":""}</p>
                </div>
                <DeleteBtn onDelete={()=>deleteCulturalPost.mutate({id:p.id})}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOK CLUB */}
      {tab==="bookclub" && (
        <div>
          {sectionLabel(`Resenhas (${(allReviews as any[]).length})`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1.5rem" }}>
            {(allReviews as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhuma resenha.</p>}
            {(allReviews as any[]).map(r=>(
              <div key={r.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 0.3rem", fontSize:"0.72rem", color:"var(--text-muted)" }}><strong>{r.userName}</strong>{r.rating ? ` · ${"★".repeat(r.rating)}` : ""} · {formatRelativeTime(r.createdAt)}</p>
                  <p style={{ margin:0, fontSize:"0.875rem" }}>{r.content.slice(0,150)}{r.content.length>150?"...":""}</p>
                </div>
                <DeleteBtn onDelete={()=>deleteReview.mutate({id:r.id})}/>
              </div>
            ))}
          </div>
          {sectionLabel(`Biblioteca (${(allBooks as any[]).length} livros)`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(allBooks as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum livro.</p>}
            {(allBooks as any[]).map(b=>(
              <div key={b.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"center" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 0.1rem", fontWeight:600, fontSize:"0.875rem" }}>{b.title}</p>
                  <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>por {b.author} · dono: {b.ownerName} · status: {b.status}</p>
                </div>
                <DeleteBtn onDelete={()=>deleteBook.mutate({id:b.id})}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOANS */}
      {tab==="loans" && (
        <div>
          {sectionLabel(`Todos os Empréstimos (${(allLoans as any[]).length})`)}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            {(allLoans as any[]).length===0 && <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Nenhum empréstimo.</p>}
            {(allLoans as any[]).map(l=>{
              const sc = loanStatusConfig[l.status];
              const isOverdue = l.status==="active" && l.dueDate && new Date(l.dueDate) < new Date();
              return (
                <div key={l.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", gap:"1rem", alignItems:"center", borderColor:isOverdue?"#fca5a5":"var(--border)", background:isOverdue?"#fff5f5":"white" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.2rem" }}>
                      <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{l.bookTitle}</p>
                      {isOverdue && <span style={{ fontSize:"0.62rem", fontWeight:700, color:"#dc2626", background:"#fef2f2", padding:"0.1rem 0.4rem", borderRadius:"99px" }}>⚠ Atrasado</span>}
                    </div>
                    <p style={{ margin:0, fontSize:"0.72rem", color:"var(--text-muted)" }}>
                      {l.requesterName} · solicitado {formatDate(l.requestedAt)}
                      {l.dueDate ? ` · devolução: ${formatDate(l.dueDate)}` : ""}
                      {l.returnedAt ? ` · devolvido: ${formatDate(l.returnedAt)}` : ""}
                    </p>
                  </div>
                  <span style={{ fontSize:"0.75rem", fontWeight:600, color:sc.color, flexShrink:0 }}>{sc.label}</span>
                  <DeleteBtn onDelete={()=>deleteLoan.mutate({id:l.id})}/>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
