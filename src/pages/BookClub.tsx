import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Library, Plus, X, BookOpen, ThumbsUp, Check, Clock, AlertCircle, User } from "lucide-react";
import { formatDate, formatRelativeTime } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

function Avatar({ name, image, size=28 }: { name?:string|null; image?:string|null; size?:number }) {
  if (image) return <img src={image} alt={name||""} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>;
  return <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg, #FB923C, #ea580c)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>{name?.[0]??""}</div>;
}

const STATUS_CONFIG: Record<string, { label:string; color:string; bg:string }> = {
  available: { label:"Disponível", color:"#16a34a", bg:"#f0fdf4" },
  reserved: { label:"Aguardando aprovação", color:"#ca8a04", bg:"#fefce8" },
  borrowed: { label:"Emprestado", color:"#2563eb", bg:"#eff6ff" },
};

const LOAN_STATUS_CONFIG: Record<string, { label:string; color:string }> = {
  requested: { label:"Aguardando", color:"#ca8a04" },
  active: { label:"Em andamento", color:"#2563eb" },
  returned: { label:"Devolvido", color:"#16a34a" },
  cancelled: { label:"Cancelado", color:"#9ca3af" },
};

export default function BookClubPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"library"|"mybooks"|"club">("library");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [approvingLoan, setApprovingLoan] = useState<number|null>(null);
  const [daysInput, setDaysInput] = useState("14");
  const [newBook, setNewBook] = useState({ title:"", author:"", type:"", notes:"" });
  const [suggest, setSuggest] = useState({ title:"", author:"" });
  const [review, setReview] = useState({ content:"", rating:0 });
  const [progressInput, setProgressInput] = useState("");

  const utils = trpc.useUtils();
  const { data: books = [] } = trpc.bookclub.getBooks.useQuery();
  const { data: myLoans = [] } = trpc.bookclub.getMyLoans.useQuery();
  const { data: loanRequests = [] } = trpc.bookclub.getLoanRequests.useQuery();
  const { data: currentReading } = trpc.bookclub.getCurrentReading.useQuery();
  const { data: votes = [] } = trpc.bookclub.getVotes.useQuery();
  const { data: myProgress } = trpc.bookclub.getMyProgress.useQuery(
    { readingId: currentReading?.id! }, { enabled: !!currentReading }
  );
  const { data: reviews = [] } = trpc.bookclub.getReviews.useQuery(
    { readingId: currentReading?.id! }, { enabled: !!currentReading }
  );

  const addBook = trpc.bookclub.addBook.useMutation({ onSuccess: () => { utils.bookclub.getBooks.invalidate(); setShowAddBook(false); setNewBook({title:"",author:"",type:"",notes:""}); toast.success("Livro cadastrado!"); } });
  const deleteMyBook = trpc.bookclub.deleteMyBook.useMutation({ onSuccess: () => { utils.bookclub.getBooks.invalidate(); toast.success("Livro removido."); } });
  const requestLoan = trpc.bookclub.requestLoan.useMutation({ onSuccess: () => { utils.bookclub.getBooks.invalidate(); utils.bookclub.getMyLoans.invalidate(); toast.success("Solicitação enviada ao dono!"); } });
  const cancelRequest = trpc.bookclub.cancelRequest.useMutation({ onSuccess: () => { utils.bookclub.getBooks.invalidate(); utils.bookclub.getMyLoans.invalidate(); toast.success("Solicitação cancelada."); } });
  const approveLoan = trpc.bookclub.approveLoan.useMutation({ onSuccess: () => { utils.bookclub.getLoanRequests.invalidate(); utils.bookclub.getBooks.invalidate(); setApprovingLoan(null); toast.success("Empréstimo aprovado!"); } });
  const rejectLoan = trpc.bookclub.rejectLoan.useMutation({ onSuccess: () => { utils.bookclub.getLoanRequests.invalidate(); utils.bookclub.getBooks.invalidate(); toast.success("Solicitação recusada."); } });
  const confirmReturn = trpc.bookclub.confirmReturn.useMutation({ onSuccess: () => { utils.bookclub.getLoanRequests.invalidate(); utils.bookclub.getBooks.invalidate(); toast.success("Devolução confirmada!"); } });
  const suggestBook = trpc.bookclub.suggestBook.useMutation({ onSuccess: () => { utils.bookclub.getVotes.invalidate(); setShowSuggest(false); setSuggest({title:"",author:""}); toast.success("Sugestão adicionada!"); } });
  const vote = trpc.bookclub.vote.useMutation({ onSuccess: () => utils.bookclub.getVotes.invalidate() });
  const updateProgress = trpc.bookclub.updateProgress.useMutation({ onSuccess: () => utils.bookclub.getMyProgress.invalidate() });
  const addReview = trpc.bookclub.addReview.useMutation({ onSuccess: () => { utils.bookclub.getReviews.invalidate(); setShowReview(false); setReview({content:"",rating:0}); toast.success("Resenha publicada!"); } });

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };

  // Find active loans for books I own (to show "confirm return" button)
  const myBooksIds = (books as any[]).filter(b => b.ownerId === user?.id).map(b => b.id);
  const activeLoansByMyBooks = (loanRequests as any[]).filter(l => l.status === "active" && myBooksIds.includes(l.bookId));
  const pendingRequestsForMyBooks = (loanRequests as any[]).filter(l => l.status === "requested");

  // Active loan I have (book I borrowed)
  const myActiveLoan = (myLoans as any[]).find(l => l.status === "active");
  const myPendingRequest = (myLoans as any[]).find(l => l.status === "requested");

  const totalNotifications = pendingRequestsForMyBooks.length + activeLoansByMyBooks.length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"#FB923C", display:"flex", alignItems:"center", justifyContent:"center" }}><Library size={24} color="white"/></div> Clube da Leitura
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>Biblioteca compartilhada, clube e resenhas</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.25rem", background:"var(--surface-2)", padding:"0.25rem", borderRadius:"0.875rem", width:"fit-content", marginBottom:"1.5rem" }}>
        {[
          { key:"library", label:"Biblioteca" },
          { key:"mybooks", label:`Meus Livros${totalNotifications>0?` (${totalNotifications})`:""}` },
          { key:"club", label:"Clube" },
        ].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key as any)}
            style={{ padding:"0.5rem 1.25rem", borderRadius:"0.75rem", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:"0.875rem", background:activeTab===t.key?"white":"transparent", color:activeTab===t.key?"var(--text)":"var(--text-muted)", boxShadow:activeTab===t.key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== LIBRARY TAB ==================== */}
      {activeTab==="library" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <p style={{ margin:0, fontSize:"0.875rem", color:"var(--text-muted)" }}>{(books as any[]).length} livro{(books as any[]).length!==1?"s":""} na biblioteca</p>
            <button className="btn-primary" onClick={()=>setShowAddBook(v=>!v)} style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
              <Plus size={16}/> Cadastrar livro
            </button>
          </div>

          {showAddBook && (
            <div className="card fade-in" style={{ padding:"1.5rem", marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
                <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Cadastrar livro</h3>
                <button className="btn-ghost" onClick={()=>setShowAddBook(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
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
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Gênero</label>
                  <input value={newBook.type} onChange={e=>setNewBook(f=>({...f,type:e.target.value}))} placeholder="Ex: Romance, Ficção..." style={inputStyle}/>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" }}>Observações</label>
                  <textarea value={newBook.notes} onChange={e=>setNewBook(f=>({...f,notes:e.target.value}))} placeholder="Estado do livro, edição, etc." style={{...inputStyle, minHeight:60, resize:"vertical"}}/>
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.875rem" }}>
                <button className="btn-primary" onClick={()=>{ if(!newBook.title||!newBook.author) return toast.error("Preencha título e autor"); addBook.mutate(newBook); }}
                  style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>Cadastrar</button>
                <button className="btn-ghost" onClick={()=>setShowAddBook(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Book list — all books with full info */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {(books as any[]).length === 0 ? (
              <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"#FB923C", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}><span style={{fontSize:"2rem"}}>📖</span></div>
                <p>Nenhum livro cadastrado. Adicione o primeiro!</p>
              </div>
            ) : (books as any[]).map(b => {
              const sc = STATUS_CONFIG[b.status];
              // Find active loan for this book
              const activeLoan = (loanRequests as any[]).find(l => l.bookId === b.id && (l.status === "active" || l.status === "requested"));
              const myLoanForThis = (myLoans as any[]).find(l => l.bookId === b.id && (l.status === "requested" || l.status === "active"));
              const isMyBook = b.ownerId === user?.id;
              const isOverdue = activeLoan?.status === "active" && activeLoan?.dueDate && new Date(activeLoan.dueDate) < new Date();

              return (
                <div key={b.id} className="card" style={{ padding:"1.25rem", borderColor: isOverdue ? "#fca5a5" : "var(--border)", background: isOverdue ? "#fff5f5" : "white" }}>
                  <div style={{ display:"flex", gap:"1rem", alignItems:"flex-start" }}>
                    {/* Book icon */}
                    <div style={{ width:48, height:56, borderRadius:"0.5rem", background:"linear-gradient(135deg, #fff7ed, #ffedd5)", border:"1px solid #fdba74", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", flexShrink:0 }}>
                      📖
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.5rem", marginBottom:"0.375rem" }}>
                        <div>
                          <h3 style={{ margin:0, fontFamily:"'DM Sans',sans-serif", fontSize:"0.95rem", fontWeight:700 }}>{b.title}</h3>
                          <p style={{ margin:"0.1rem 0 0", fontSize:"0.8rem", color:"var(--text-muted)" }}>por {b.author}{b.type ? ` · ${b.type}` : ""}</p>
                        </div>
                        <span className="badge" style={{ background:sc.bg, color:sc.color, flexShrink:0 }}>{sc.label}</span>
                      </div>

                      {/* Owner + borrower info */}
                      <div style={{ display:"flex", gap:"1.25rem", flexWrap:"wrap", marginTop:"0.5rem" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:"var(--text-muted)" }}>
                          <User size={13}/>
                          <span>Dono: <strong>{isMyBook ? "Você" : b.ownerName}</strong></span>
                        </div>

                        {activeLoan && activeLoan.status === "active" && (
                          <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:"#2563eb" }}>
                            <BookOpen size={13}/>
                            <span>Com: <strong>{activeLoan.requesterName}</strong></span>
                          </div>
                        )}

                        {activeLoan && activeLoan.status === "requested" && (
                          <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color:"#ca8a04" }}>
                            <Clock size={13}/>
                            <span>Solicitado por: <strong>{activeLoan.requesterName}</strong></span>
                          </div>
                        )}

                        {activeLoan?.dueDate && activeLoan.status === "active" && (
                          <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", color: isOverdue ? "#dc2626" : "var(--text-muted)" }}>
                            {isOverdue ? <AlertCircle size={13}/> : <Clock size={13}/>}
                            <span>{isOverdue ? "Atrasado! " : "Devolver até: "}<strong>{formatDate(activeLoan.dueDate)}</strong></span>
                          </div>
                        )}
                      </div>

                      {b.notes && <p style={{ margin:"0.5rem 0 0", fontSize:"0.75rem", color:"var(--text-muted)", fontStyle:"italic" }}>{b.notes}</p>}
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", flexShrink:0 }}>
                      {/* Request loan */}
                      {!isMyBook && b.status === "available" && !myLoanForThis && (
                        <button className="btn-primary" onClick={()=>requestLoan.mutate({bookId:b.id})}
                          style={{ fontSize:"0.8rem", padding:"0.4rem 0.875rem", background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
                          Pedir emprestado
                        </button>
                      )}

                      {/* Cancel my request */}
                      {!isMyBook && myLoanForThis?.status === "requested" && (
                        <button className="btn-ghost" onClick={()=>cancelRequest.mutate({loanId:myLoanForThis.id})}
                          style={{ fontSize:"0.8rem", padding:"0.4rem 0.875rem", color:"#dc2626", borderColor:"#fecaca" }}>
                          Cancelar solicitação
                        </button>
                      )}

                      {/* Confirm return (owner) */}
                      {isMyBook && activeLoan?.status === "active" && (
                        <button className="btn-primary" onClick={()=>confirmReturn.mutate({loanId:activeLoan.id})}
                          style={{ fontSize:"0.8rem", padding:"0.4rem 0.875rem", background:"linear-gradient(135deg, #4CAF82, #389968)" }}>
                          <Check size={13}/> Confirmar devolução
                        </button>
                      )}

                      {/* Delete my book */}
                      {isMyBook && b.status === "available" && (
                        <button className="btn-ghost" onClick={()=>deleteMyBook.mutate({id:b.id})}
                          style={{ fontSize:"0.75rem", padding:"0.35rem 0.75rem", color:"#dc2626", borderColor:"#fecaca" }}>
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Approve/reject (owner, pending request) */}
                  {isMyBook && activeLoan?.status === "requested" && (
                    <div style={{ marginTop:"1rem", padding:"0.875rem", background:"#fefce8", borderRadius:"0.75rem", border:"1px solid #fde68a", display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
                      <p style={{ margin:0, fontSize:"0.8rem", flex:1 }}>
                        <strong>{activeLoan.requesterName}</strong> quer pegar este livro emprestado
                      </p>
                      {approvingLoan === activeLoan.id ? (
                        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                          <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>Prazo (dias):</span>
                          <input type="number" value={daysInput} onChange={e=>setDaysInput(e.target.value)} min={1} max={90}
                            style={{ width:60, padding:"0.3rem 0.5rem", border:"1.5px solid var(--primary)", borderRadius:"0.5rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none" }}/>
                          <button onClick={()=>approveLoan.mutate({loanId:activeLoan.id, daysToReturn:parseInt(daysInput)||14})}
                            style={{ background:"#4CAF82", color:"white", border:"none", borderRadius:"0.625rem", padding:"0.375rem 0.75rem", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.3rem" }}>
                            <Check size={13}/> Confirmar
                          </button>
                          <button onClick={()=>setApprovingLoan(null)} className="btn-ghost" style={{ padding:"0.375rem 0.625rem", fontSize:"0.8rem" }}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ display:"flex", gap:"0.5rem" }}>
                          <button onClick={()=>setApprovingLoan(activeLoan.id)}
                            style={{ background:"#4CAF82", color:"white", border:"none", borderRadius:"0.625rem", padding:"0.375rem 0.875rem", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.3rem" }}>
                            <Check size={13}/> Aprovar
                          </button>
                          <button onClick={()=>rejectLoan.mutate({loanId:activeLoan.id})}
                            style={{ background:"white", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:"0.625rem", padding:"0.375rem 0.75rem", cursor:"pointer", fontSize:"0.8rem" }}>
                            <X size={13}/> Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== MY BOOKS TAB ==================== */}
      {activeTab==="mybooks" && (
        <div>
          {/* Loans I'm managing */}
          {(myLoans as any[]).length > 0 && (
            <div style={{ marginBottom:"2rem" }}>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", margin:"0 0 0.875rem" }}>
                Meus empréstimos
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                {(myLoans as any[]).map(l=>{
                  const sc = LOAN_STATUS_CONFIG[l.status];
                  const isOverdue = l.status==="active" && l.dueDate && new Date(l.dueDate) < new Date();
                  return (
                    <div key={l.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", borderColor:isOverdue?"#fca5a5":"var(--border)", background:isOverdue?"#fff5f5":"white" }}>
                      <BookOpen size={20} color="#FB923C" style={{ flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:"0 0 0.2rem", fontWeight:600, fontSize:"0.875rem" }}>{l.bookTitle}</p>
                        <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>
                          por {l.bookAuthor}
                          {l.startDate ? ` · retirado em ${formatDate(l.startDate)}` : ""}
                          {l.dueDate && l.status==="active" ? ` · devolver até ${formatDate(l.dueDate)}` : ""}
                          {l.returnedAt ? ` · devolvido em ${formatDate(l.returnedAt)}` : ""}
                        </p>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
                        {isOverdue && <AlertCircle size={16} color="#dc2626"/>}
                        <span style={{ fontSize:"0.8rem", fontWeight:600, color:sc.color }}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My books with pending/active loans */}
          {(books as any[]).filter(b=>b.ownerId===user?.id).length > 0 && (
            <div>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", margin:"0 0 0.875rem" }}>
                Livros que cadastrei
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                {(books as any[]).filter(b=>b.ownerId===user?.id).map(b=>{
                  const sc = STATUS_CONFIG[b.status];
                  const loan = (loanRequests as any[]).find(l=>l.bookId===b.id&&(l.status==="requested"||l.status==="active"));
                  return (
                    <div key={b.id} className="card" style={{ padding:"1rem 1.25rem" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:"0 0 0.2rem", fontWeight:600, fontSize:"0.875rem" }}>{b.title}</p>
                          <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>por {b.author}</p>
                        </div>
                        <span className="badge" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                      </div>
                      {loan && (
                        <div style={{ marginTop:"0.75rem", padding:"0.75rem", background:"var(--surface-2)", borderRadius:"0.75rem", fontSize:"0.8rem" }}>
                          {loan.status==="requested" && (
                            <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
                              <span>📬 <strong>{loan.requesterName}</strong> solicitou este livro</span>
                              {approvingLoan===loan.id ? (
                                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                                  <span style={{ fontSize:"0.75rem" }}>Prazo (dias):</span>
                                  <input type="number" value={daysInput} onChange={e=>setDaysInput(e.target.value)} min={1} max={90}
                                    style={{ width:55, padding:"0.25rem 0.4rem", border:"1.5px solid var(--primary)", borderRadius:"0.5rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", outline:"none" }}/>
                                  <button onClick={()=>approveLoan.mutate({loanId:loan.id,daysToReturn:parseInt(daysInput)||14})}
                                    style={{ background:"#4CAF82", color:"white", border:"none", borderRadius:"0.5rem", padding:"0.3rem 0.625rem", cursor:"pointer", fontSize:"0.75rem", fontWeight:600 }}>
                                    ✓ Ok
                                  </button>
                                  <button onClick={()=>setApprovingLoan(null)} style={{ background:"white", border:"1px solid var(--border)", borderRadius:"0.5rem", padding:"0.3rem 0.5rem", cursor:"pointer", fontSize:"0.75rem" }}>✕</button>
                                </div>
                              ) : (
                                <div style={{ display:"flex", gap:"0.5rem", marginLeft:"auto" }}>
                                  <button onClick={()=>setApprovingLoan(loan.id)} style={{ background:"#4CAF82", color:"white", border:"none", borderRadius:"0.5rem", padding:"0.3rem 0.75rem", cursor:"pointer", fontSize:"0.75rem", fontWeight:600 }}>Aprovar</button>
                                  <button onClick={()=>rejectLoan.mutate({loanId:loan.id})} style={{ background:"white", color:"#dc2626", border:"1px solid #fecaca", borderRadius:"0.5rem", padding:"0.3rem 0.625rem", cursor:"pointer", fontSize:"0.75rem" }}>Recusar</button>
                                </div>
                              )}
                            </div>
                          )}
                          {loan.status==="active" && (
                            <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
                              <span>📖 Com <strong>{loan.requesterName}</strong> até {formatDate(loan.dueDate)}</span>
                              <button onClick={()=>confirmReturn.mutate({loanId:loan.id})}
                                style={{ marginLeft:"auto", background:"var(--primary)", color:"white", border:"none", borderRadius:"0.5rem", padding:"0.3rem 0.75rem", cursor:"pointer", fontSize:"0.75rem", fontWeight:600, display:"flex", alignItems:"center", gap:"0.3rem" }}>
                                <Check size={12}/> Confirmar devolução
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(myLoans as any[]).length===0 && (books as any[]).filter(b=>b.ownerId===user?.id).length===0 && (
            <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", background:"#FB923C", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}><span style={{fontSize:"2rem"}}>📖</span></div>
              <p style={{ marginBottom:"1rem" }}>Você ainda não tem livros nem empréstimos.</p>
              <button className="btn-primary" onClick={()=>{ setActiveTab("library"); setShowAddBook(true); }} style={{ background:"linear-gradient(135deg, #FB923C, #ea580c)" }}>
                <Plus size={16}/> Cadastrar meu primeiro livro
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== CLUB TAB ==================== */}
      {activeTab==="club" && (
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
                    <p style={{ margin:0, fontWeight:600 }}>{formatDate(currentReading.endDate)}</p>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.5rem" }}>
                  <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-muted)" }}>Seu progresso</span>
                  {myProgress?.finished && <span className="badge" style={{ background:"#4CAF82", color:"white" }}>✓ Concluído</span>}
                </div>
                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                  <input type="number" placeholder="Página atual" value={progressInput} onChange={e=>setProgressInput(e.target.value)}
                    style={{ width:110, padding:"0.4rem 0.625rem", border:"1.5px solid var(--border)", borderRadius:"0.625rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.875rem", outline:"none" }}/>
                  <button className="btn-primary" onClick={()=>{ if(progressInput) updateProgress.mutate({readingId:currentReading.id,currentPage:parseInt(progressInput)}); }}
                    style={{ padding:"0.4rem 0.875rem", fontSize:"0.8rem" }}>Salvar</button>
                  {!myProgress?.finished && (
                    <button className="btn-ghost" onClick={()=>updateProgress.mutate({readingId:currentReading.id,currentPage:myProgress?.currentPage??0,finished:true})}
                      style={{ padding:"0.4rem 0.875rem", fontSize:"0.8rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                      <Check size={13}/> Concluí o livro
                    </button>
                  )}
                  {myProgress?.currentPage ? <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Página {myProgress.currentPage}{myProgress.totalPages?` de ${myProgress.totalPages}`:""}</span> : null}
                </div>
              </div>

              {!showReview ? (
                <button className="btn-ghost" onClick={()=>setShowReview(true)} style={{ fontSize:"0.8rem" }}>✍️ Escrever resenha</button>
              ) : (
                <div style={{ marginTop:"0.875rem" }}>
                  <div style={{ display:"flex", gap:"0.25rem", marginBottom:"0.625rem" }}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setReview(f=>({...f,rating:f.rating===n?0:n}))} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.375rem", color:n<=review.rating?"#FB923C":"#d1d5db" }}>★</button>
                    ))}
                  </div>
                  <textarea value={review.content} onChange={e=>setReview(f=>({...f,content:e.target.value}))} placeholder="O que você achou do livro?" style={{...inputStyle, minHeight:80, resize:"vertical", marginBottom:"0.625rem"}}/>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="btn-primary" onClick={()=>{ if(!review.content.trim()) return; addReview.mutate({readingId:currentReading.id,...review,rating:review.rating||undefined}); }} style={{ fontSize:"0.8rem" }}>Publicar</button>
                    <button className="btn-ghost" onClick={()=>setShowReview(false)} style={{ fontSize:"0.8rem" }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding:"1.5rem", marginBottom:"1.5rem", textAlign:"center", color:"var(--text-muted)" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"#FB923C", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 0.75rem" }}><span style={{fontSize:"1.5rem"}}>📖</span></div>
              <p>Nenhuma leitura ativa no momento.</p>
            </div>
          )}

          {/* Reviews */}
          {(reviews as any[]).length > 0 && (
            <div style={{ marginBottom:"1.5rem" }}>
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", margin:"0 0 0.875rem" }}>Resenhas</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                {(reviews as any[]).map(r=>(
                  <div key={r.id} className="card" style={{ padding:"1.25rem" }}>
                    <div style={{ display:"flex", gap:"0.75rem" }}>
                      <Avatar name={r.userName} image={r.userImage}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{r.userName}</span>
                          <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{formatRelativeTime(r.createdAt)}</span>
                        </div>
                        {r.rating && <div style={{ display:"flex", gap:"2px", margin:"0.2rem 0" }}>{[1,2,3,4,5].map(n=><span key={n} style={{ color:n<=r.rating?"#FB923C":"#d1d5db", fontSize:"0.875rem" }}>★</span>)}</div>}
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
              <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", margin:0 }}>Próxima leitura — votação</h2>
              <button className="btn-ghost" onClick={()=>setShowSuggest(v=>!v)} style={{ fontSize:"0.8rem" }}><Plus size={14}/> Sugerir</button>
            </div>
            {showSuggest && (
              <div className="card" style={{ padding:"1.25rem", marginBottom:"1rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                  <input value={suggest.title} onChange={e=>setSuggest(f=>({...f,title:e.target.value}))} placeholder="Título do livro *" style={inputStyle}/>
                  <input value={suggest.author} onChange={e=>setSuggest(f=>({...f,author:e.target.value}))} placeholder="Autor" style={inputStyle}/>
                </div>
                <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.75rem" }}>
                  <button className="btn-primary" onClick={()=>{ if(!suggest.title.trim()) return; suggestBook.mutate(suggest); }} style={{ fontSize:"0.8rem" }}>Sugerir</button>
                  <button className="btn-ghost" onClick={()=>setShowSuggest(false)} style={{ fontSize:"0.8rem" }}>Cancelar</button>
                </div>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {(votes as any[]).sort((a:any,b:any)=>b.voteCount-a.voteCount).map((v:any)=>(
                <div key={v.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.9rem" }}>{v.title}</p>
                    {v.author && <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-muted)" }}>{v.author}</p>}
                  </div>
                  <span style={{ fontSize:"0.875rem", fontWeight:600, color:"#FB923C" }}>{v.voteCount} voto{v.voteCount!==1?"s":""}</span>
                  <button onClick={()=>vote.mutate({voteId:v.id})}
                    style={{ background:v.userVoted?"#fff7ed":"white", border:`1.5px solid ${v.userVoted?"#FB923C":"var(--border)"}`, borderRadius:"0.625rem", padding:"0.375rem 0.75rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.8rem", fontWeight:500, color:v.userVoted?"#FB923C":"var(--text-muted)" }}>
                    <ThumbsUp size={13}/> {v.userVoted?"Votado":"Votar"}
                  </button>
                </div>
              ))}
              {(votes as any[]).length===0 && <p style={{ textAlign:"center", color:"var(--text-muted)", fontSize:"0.875rem", padding:"1rem" }}>Nenhuma sugestão ainda.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
