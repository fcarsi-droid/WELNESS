import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Library, Plus, X, BookOpen, ThumbsUp, Check } from "lucide-react";
import { formatDate } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

function Avatar({ name, image, size=32 }: { name?:string|null; image?:string|null; size?:number }) {
  if (image) return <img src={image} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg, #FB923C, #ea580c)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.[0]??""}</div>;
}

export default function BookClubPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"club"|"library">("club");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [newBook, setNewBook] = useState({ title:"", author:"", type:"", notes:"" });
  const [suggest, setSuggest] = useState({ title:"", author:"" });
  const [review, setReview] = useState({ content:"", rating:0 });
  const [progressInput, setProgressInput] = useState("");

  const utils = trpc.useUtils();
  const { data: currentReading } = trpc.bookclub.getCurrentReading.useQuery();
  const { data: votes = [] } = trpc.bookclub.getVotes.useQuery();
  const { data: books = [] } = trpc.bookclub.getBooks.useQuery();
  const { data: myLoans = [] } = trpc.bookclub.getMyLoans.useQuery();
  const { data: loanRequests = [] } = trpc.bookclub.getLoanRequests.useQuery();
  const { data: myProgress } = trpc.bookclub.getMyProgress.useQuery({ readingId: currentReading?.id! }, { enabled: !!currentReading });
  const { data: reviews = [] } = trpc.bookclub.getReviews.useQuery({ readingId: currentReading?.id! }, { enabled: !!currentReading });

  const addBook = trpc.bookclub.addBook.useMutation({ onSuccess: () => { utils.bookclub.getBooks.invalidate(); setShowAddBook(false); setNewBook({title:"",author:"",type:"",notes:""}); toast.success("Livro adicionado!"); } });
  const requestLoan = trpc.bookclub.requestLoan.useMutation({ onSuccess: () => { utils.bookclub.getBooks.invalidate(); utils.bookclub.getMyLoans.invalidate(); toast.success("Empréstimo solicitado!"); } });
  const approveLoan = trpc.bookclub.approveLoan.useMutation({ onSuccess: () => { utils.bookclub.getLoanRequests.invalidate(); utils.bookclub.getBooks.invalidate(); toast.success("Empréstimo aprovado!"); } });
  const returnBook = trpc.bookclub.confirmReturn.useMutation({ onSuccess: () => { utils.bookclub.getMyLoans.invalidate(); toast.success("Devolução registrada!"); } });
  const suggestBook = trpc.bookclub.suggestBook.useMutation({ onSuccess: () => { utils.bookclub.getVotes.invalidate(); setShowSuggest(false); setSuggest({title:"",author:""}); toast.success("Sugestão adicionada!"); } });
  const vote = trpc.bookclub.vote.useMutation({ onSuccess: () => utils.bookclub.getVotes.invalidate() });
  const updateProgress = trpc.bookclub.updateProgress.useMutation({ onSuccess: () => utils.bookclub.getMyProgress.invalidate() });
  const addReview = trpc.bookclub.addReview.useMutation({ onSuccess: () => { utils.bookclub.getReviews.invalidate(); setShowReview(false); setReview({content:"",rating:0}); toast.success("Resenha publicada!"); } });

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  const statusColor: Record<string, string> = { available:"#4CAF82", borrowed:"#FB923C", reserved:"#A78BFA" };
  const statusLabel: Record<string, string> = { available:"Disponível", borrowed:"Emprestado", reserved:"Reservado" };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <Library size={28} color="#FB923C"/> Clube da Leitura
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>Leitura coletiva, biblioteca e resenhas</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.875rem", width:"fit-content", marginBottom:"1.5rem" }}>
        {[["club","Clube"],["library","Biblioteca"]].map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)}
            style={{ padding:"0.5rem 1.25rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans', sans-serif", fontWeight:500, fontSize:"0.875rem", background:activeTab===k?"white":"transparent", color:activeTab===k?"var(--text)":"var(--text-muted)", boxShadow:activeTab===k?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
            {l}
          </button>
        ))}
      </div>

      {activeTab === "club" && (
        <div>
          {/* Current reading */}
          {currentReading ? (
            <div className="card" style={{ padding:"1.5rem", marginBottom:"1.5rem", background:"linear-gradient(135deg, #fff7ed, #ffedd5)", borderColor:"#fdba74" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
                <div>
                  <span className="badge" style={{ background:"#FB923C", color:"white", marginBottom:"0.5rem", display:"inline-block" }}>📖 Leitura atual</span>
                  <h2 style={{ margin:"0 0 0.25rem", fontSize:"1.25rem" }}>{currentReading.externalTitle || "Livro do clube"}</h2>
                  {currentReading.externalAuthor && <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>por {currentReading.externalAuthor}</p>}
                </div>
                {currentReading.endDate && (
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>Prazo</p>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{formatDate(currentReading.endDate)}</p>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.5rem" }}>
                  <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-muted)" }}>Seu progresso</span>
                  {myProgress?.finished && <span className="badge" style={{ background:"#4CAF82", color:"white" }}>✓ Concluído</span>}
                </div>
                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                  <input type="number" placeholder="Página atual" value={progressInput} onChange={e=>setProgressInput(e.target.value)}
                    style={{ width:100, padding:"0.4rem 0.625rem", border:"1.5px solid var(--border)", borderRadius:"0.625rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", outline:"none" }}/>
                  <button className="btn-primary" onClick={() => { if(progressInput) updateProgress.mutate({ readingId:currentReading.id, currentPage:parseInt(progressInput) }); }}
                    style={{ padding:"0.4rem 0.875rem", fontSize:"0.8rem" }}>Salvar</button>
                  {!myProgress?.finished && (
                    <button className="btn-ghost" onClick={() => updateProgress.mutate({ readingId:currentReading.id, currentPage:myProgress?.currentPage??0, finished:true })}
                      style={{ padding:"0.4rem 0.875rem", fontSize:"0.8rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                      <Check size={13}/> Concluí
                    </button>
                  )}
                  {myProgress?.currentPage && <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Página {myProgress.currentPage}{myProgress.totalPages ? ` de ${myProgress.totalPages}` : ""}</span>}
                </div>
              </div>

              {/* Review */}
              {!showReview ? (
                <button className="btn-ghost" onClick={() => setShowReview(true)} style={{ fontSize:"0.8rem" }}>Escrever resenha</button>
              ) : (
                <div style={{ marginTop:"0.875rem" }}>
                  <div style={{ display:"flex", gap:"0.25rem", marginBottom:"0.625rem" }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setReview(f=>({...f,rating:f.rating===n?0:n}))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.375rem", color:n<=review.rating?"#FB923C":"#d1d5db" }}>★</button>
                    ))}
                  </div>
                  <textarea value={review.content} onChange={e=>setReview(f=>({...f,content:e.target.value}))} placeholder="O que você achou do livro?" style={{...inputStyle, minHeight:80, resize:"vertical", marginBottom:"0.625rem"}}/>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="btn-primary" onClick={() => { if(!review.content.trim()) return; addReview.mutate({ readingId:currentReading.id, ...review, rating:review.rating||undefined }); }}
                      style={{ fontSize:"0.8rem" }}>Publicar</button>
                    <button className="btn-ghost" onClick={() => setShowReview(false)} style={{ fontSize:"0.8rem" }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding:"1.5rem", marginBottom:"1.5rem", textAlign:"center", color:"var(--text-muted)" }}>
              <p style={{ fontSize:"2rem", margin:"0 0 0.5rem" }}>📚</p>
              <p>Nenhuma leitura ativa no momento.</p>
              {isAdmin && <p style={{ fontSize:"0.8rem" }}>Configure a leitura atual na administração.</p>}
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginBottom:"1.5rem" }}>
              <h2 className="section-label">Resenhas</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                {reviews.map(r => (
                  <div key={r.id} className="card" style={{ padding:"1.25rem" }}>
                    <div style={{ display:"flex", gap:"0.75rem" }}>
                      <Avatar name={r.userName} image={r.userImage}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{r.userName}</span>
                          <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{formatDate(String(r.createdAt))}</span>
                        </div>
                        {r.rating && <div style={{ display:"flex", gap:"2px", margin:"0.2rem 0" }}>{[1,2,3,4,5].map(n=><span key={n} style={{ color:n<=r.rating!?"#FB923C":"#d1d5db", fontSize:"0.875rem" }}>★</span>)}</div>}
                        <p style={{ margin:"0.4rem 0 0", fontSize:"0.875rem", lineHeight:1.6 }}>{r.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voting */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <h2 className="section-label" style={{ margin:0 }}>Próxima leitura — votação</h2>
              <button className="btn-ghost" onClick={() => setShowSuggest(v=>!v)} style={{ fontSize:"0.8rem" }}>
                <Plus size={14}/> Sugerir
              </button>
            </div>
            {showSuggest && (
              <div className="card" style={{ padding:"1.25rem", marginBottom:"1rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                  <input value={suggest.title} onChange={e=>setSuggest(f=>({...f,title:e.target.value}))} placeholder="Título do livro *" style={inputStyle}/>
                  <input value={suggest.author} onChange={e=>setSuggest(f=>({...f,author:e.target.value}))} placeholder="Autor" style={inputStyle}/>
                </div>
                <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.75rem" }}>
                  <button className="btn-primary" onClick={() => { if(!suggest.title.trim()) return; suggestBook.mutate(suggest); }} style={{ fontSize:"0.8rem" }}>Sugerir</button>
                  <button className="btn-ghost" onClick={() => setShowSuggest(false)} style={{ fontSize:"0.8rem" }}>Cancelar</button>
                </div>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {votes.sort((a,b)=>b.voteCount-a.voteCount).map(v => (
                <div key={v.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.9rem" }}>{v.title}</p>
                    {v.author && <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-muted)" }}>{v.author}</p>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                    <span style={{ fontSize:"0.875rem", fontWeight:600, color:"#FB923C" }}>{v.voteCount} votos</span>
                    <button onClick={() => vote.mutate({ voteId: v.id })}
                      style={{ background:v.userVoted?"#fff7ed":"white", border:`1.5px solid ${v.userVoted?"#FB923C":"var(--border)"}`, borderRadius:"0.625rem", padding:"0.375rem 0.75rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.8rem", fontWeight:500, color:v.userVoted?"#FB923C":"var(--text-muted)" }}>
                      <ThumbsUp size={13}/> {v.userVoted ? "Votado" : "Votar"}
                    </button>
                  </div>
                </div>
              ))}
              {votes.length === 0 && <p style={{ textAlign:"center", color:"var(--text-muted)", fontSize:"0.875rem", padding:"1rem" }}>Nenhuma sugestão ainda. Seja o primeiro!</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "library" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <p style={{ margin:0, fontSize:"0.875rem", color:"var(--text-muted)" }}>{books.length} livro{books.length!==1?"s":""} disponíveis</p>
            <button className="btn-primary" onClick={() => setShowAddBook(v=>!v)} style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
              <Plus size={16}/> Cadastrar livro
            </button>
          </div>

          {showAddBook && (
            <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
                <h3 style={{ margin:0, fontFamily:"'DM Sans', sans-serif", fontWeight:600 }}>Cadastrar livro</h3>
                <button className="btn-ghost" onClick={() => setShowAddBook(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Título *</label>
                  <input value={newBook.title} onChange={e=>setNewBook(f=>({...f,title:e.target.value}))} style={inputStyle}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Autor *</label>
                  <input value={newBook.author} onChange={e=>setNewBook(f=>({...f,author:e.target.value}))} style={inputStyle}/>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Gênero/Tipo</label>
                  <input value={newBook.type} onChange={e=>setNewBook(f=>({...f,type:e.target.value}))} placeholder="Ex: Romance, Autoajuda..." style={inputStyle}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Observações</label>
                  <textarea value={newBook.notes} onChange={e=>setNewBook(f=>({...f,notes:e.target.value}))} placeholder="Estado do livro, detalhes..." style={{...inputStyle, minHeight:60, resize:"vertical"}}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.875rem" }}>
                <button className="btn-primary" onClick={() => { if(!newBook.title||!newBook.author) return toast.error("Preencha título e autor"); addBook.mutate(newBook); }}
                  style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>Cadastrar</button>
                <button className="btn-ghost" onClick={() => setShowAddBook(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Loan requests */}
          {loanRequests.length > 0 && (
            <div style={{ marginBottom:"1.5rem" }}>
              <h2 className="section-label">Solicitações de empréstimo</h2>
              {loanRequests.map(lr => (
                <div key={lr.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", marginBottom:"0.5rem", borderColor:"#fdba74", background:"#fff7ed" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{lr.bookTitle}</p>
                    <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-muted)" }}>{lr.requesterName} quer pegar emprestado</p>
                  </div>
                  <button className="btn-primary" onClick={() => approveLoan.mutate({ loanId: lr.id })} style={{ fontSize:"0.8rem" }}>Aprovar</button>
                </div>
              ))}
            </div>
          )}

          {/* My loans */}
          {myLoans.filter(l=>l.status==="active").length > 0 && (
            <div style={{ marginBottom:"1.5rem" }}>
              <h2 className="section-label">Meus empréstimos ativos</h2>
              {myLoans.filter(l=>l.status==="active").map(l => (
                <div key={l.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", marginBottom:"0.5rem" }}>
                  <BookOpen size={20} color="#FB923C"/>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{l.bookTitle}</p>
                    {l.dueDate && <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-muted)" }}>Devolver até {formatDate(String(l.dueDate))}</p>}
                  </div>
                  <button className="btn-ghost" onClick={() => returnBook.mutate({ loanId: l.id })} style={{ fontSize:"0.8rem" }}>Devolver</button>
                </div>
              ))}
            </div>
          )}

          {/* Books grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:"0.875rem" }}>
            {books.map(b => (
              <div key={b.id} className="card" style={{ padding:"1.25rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem" }}>
                  <h3 style={{ margin:0, fontFamily:"'DM Sans', sans-serif", fontSize:"0.9rem", fontWeight:600, flex:1, marginRight:"0.5rem" }}>{b.title}</h3>
                  <span className="badge" style={{ background:`${statusColor[b.status]}20`, color:statusColor[b.status], flexShrink:0, fontSize:"0.65rem" }}>
                    {statusLabel[b.status]}
                  </span>
                </div>
                <p style={{ margin:"0 0 0.25rem", fontSize:"0.8rem", color:"var(--text-muted)" }}>por {b.author}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"0.875rem" }}>
                  <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                    {b.ownerId === user?.id ? "Meu livro" : `de ${b.ownerName}`}
                  </span>
                  {b.status === "available" && b.ownerId !== user?.id && (
                    <button className="btn-primary" onClick={() => requestLoan.mutate({ bookId: b.id })}
                      style={{ fontSize:"0.75rem", padding:"0.35rem 0.75rem", background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
                      Pedir emprestado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {books.length === 0 && (
            <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
              <p style={{ fontSize:"3rem", margin:"0 0 1rem" }}>📚</p>
              <p>Nenhum livro cadastrado. Adicione o primeiro!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
