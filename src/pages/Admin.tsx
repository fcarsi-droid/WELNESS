import { trpc } from "../lib/trpc";
import { Settings, Check, X, Shield, UserX } from "lucide-react";
import { formatDate } from "../lib/utils";
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

export default function AdminPage() {
  const utils = trpc.useUtils();
  const { data: pending = [] } = trpc.admin.getPendingUsers.useQuery();
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery();

  const approve = trpc.admin.approveUser.useMutation({ onSuccess: () => { utils.admin.getPendingUsers.invalidate(); utils.admin.getAllUsers.invalidate(); toast.success("Usuário aprovado!"); } });
  const ban = trpc.admin.banUser.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Usuário suspenso."); } });
  const reactivate = trpc.admin.reactivateUser.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Usuário reativado!"); } });
  const promote = trpc.admin.promoteToAdmin.useMutation({ onSuccess: () => { utils.admin.getAllUsers.invalidate(); toast.success("Usuário promovido a admin!"); } });

  return (
    <div className="fade-in" style={{ maxWidth:800, margin:"0 auto" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <Settings size={28} color="#64748b"/> Administração
        </h1>
        <p style={{ margin:0, color:"var(--text-muted)" }}>Gerencie usuários e acesso à plataforma</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"1rem", marginBottom:"2rem" }}>
        {[
          { label:"Aguardando aprovação", value:pending.length, color:"#ca8a04", bg:"#fefce8" },
          { label:"Usuários ativos", value:allUsers.filter(u=>u.status==="active").length, color:"#16a34a", bg:"#f0fdf4" },
          { label:"Total de membros", value:allUsers.length + 1, color:"#64748b", bg:"var(--surface-2)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"1.25rem", textAlign:"center", borderColor:s.bg==="var(--surface-2)"?"var(--border)":s.color+"40", background:s.bg }}>
            <p style={{ margin:"0 0 0.25rem", fontSize:"2rem", fontWeight:700, color:s.color, fontFamily:"'Playfair Display', serif" }}>{s.value}</p>
            <p style={{ margin:0, fontSize:"0.75rem", color:s.color, fontWeight:500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom:"2rem" }}>
          <h2 style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#ca8a04", margin:"0 0 1rem" }}>
            ⏳ Aguardando aprovação ({pending.length})
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
            {pending.map(u => (
              <div key={u.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem", borderColor:"#fde68a", background:"#fefce8" }}>
                <Avatar name={u.name} image={u.image}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{u.name}</p>
                  <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>{u.email}</p>
                </div>
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={() => approve.mutate({ userId: u.id })}
                    style={{ display:"flex", alignItems:"center", gap:"0.3rem", padding:"0.4rem 0.875rem", background:"#4CAF82", color:"white", border:"none", borderRadius:"0.625rem", cursor:"pointer", fontSize:"0.8rem", fontWeight:600 }}>
                    <Check size={14}/> Aprovar
                  </button>
                  <button onClick={() => ban.mutate({ userId: u.id })}
                    style={{ display:"flex", alignItems:"center", gap:"0.3rem", padding:"0.4rem 0.75rem", background:"white", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:"0.625rem", cursor:"pointer", fontSize:"0.8rem", fontWeight:500 }}>
                    <X size={14}/> Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All users */}
      <div>
        <h2 style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text-muted)", margin:"0 0 1rem" }}>
          Todos os membros
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {allUsers.map(u => {
            const sc = statusConfig[u.status];
            return (
              <div key={u.id} className="card" style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"1rem" }}>
                <Avatar name={u.name} image={u.image}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.875rem" }}>{u.name}</p>
                    {u.role === "admin" && <span className="badge" style={{ background:"#eff6ff", color:"#2563eb", fontSize:"0.65rem" }}>Admin</span>}
                  </div>
                  <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-muted)" }}>{u.email}</p>
                </div>
                <span className="badge" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                <div style={{ display:"flex", gap:"0.375rem" }}>
                  {u.status === "active" && (
                    <>
                      {u.role !== "admin" && (
                        <button onClick={() => promote.mutate({ userId: u.id })} title="Promover a admin"
                          style={{ background:"#eff6ff", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", color:"#2563eb", display:"flex" }}>
                          <Shield size={14}/>
                        </button>
                      )}
                      <button onClick={() => ban.mutate({ userId: u.id })} title="Suspender"
                        style={{ background:"#fef2f2", border:"none", borderRadius:"0.5rem", padding:"0.375rem", cursor:"pointer", color:"#dc2626", display:"flex" }}>
                        <UserX size={14}/>
                      </button>
                    </>
                  )}
                  {u.status === "banned" && (
                    <button onClick={() => reactivate.mutate({ userId: u.id })} title="Reativar"
                      style={{ background:"#f0fdf4", border:"none", borderRadius:"0.5rem", padding:"0.375rem 0.625rem", cursor:"pointer", color:"#16a34a", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.75rem", fontWeight:500 }}>
                      <Check size={13}/> Reativar
                    </button>
                  )}
                  {u.status === "pending" && (
                    <button onClick={() => approve.mutate({ userId: u.id })}
                      style={{ background:"#f0fdf4", border:"none", borderRadius:"0.5rem", padding:"0.375rem 0.625rem", cursor:"pointer", color:"#16a34a", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.75rem", fontWeight:500 }}>
                      <Check size={13}/> Aprovar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
