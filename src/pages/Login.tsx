import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../hooks/useAuth";
export default function LoginPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { data: authData } = trpc.auth.getGoogleAuthUrl.useQuery();
  useEffect(() => { if (!isLoading && user?.status==="active") navigate("/"); }, [user, isLoading]);
  const isPending = user?.status === "pending"; const isBanned = user?.status === "banned";
  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--surface)" }}>
      <div className="hidden lg:flex" style={{ flex:1, background:"linear-gradient(145deg, #1a2a3a 0%, #1e3a2e 50%, #2a1a3a 100%)", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"3rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:400 }}>
          <img src="/logo.png" alt="Wellness" style={{ width:180, height:"auto", marginBottom:"2rem" }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
          <p style={{ fontSize:"1.05rem", color:"rgba(255,255,255,0.75)", lineHeight:1.7 }}>Seu espaço de bem-estar e cultura corporativa.</p>
        </div>
      </div>
      <div style={{ width:"100%", maxWidth:480, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"2rem", margin:"0 auto" }}>
        <div className="fade-in" style={{ width:"100%", maxWidth:380 }}>
          <div className="lg:hidden" style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <img src="/logo.png" alt="Wellness" style={{ width:140, height:"auto", margin:"0 auto 0.75rem" }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
          </div>
          <div className="card" style={{ padding:"2.5rem" }}>
            {isPending ? (
              <div style={{ textAlign:"center" }}>
                <div style={{ width:64, height:64, borderRadius:18, background:"#fefce8", border:"1.5px solid #fde68a", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}><i className="ti ti-hourglass" style={{ fontSize:34, color:"#eab308" }} aria-hidden="true"/></div>
                <h2 style={{ margin:"0 0 0.75rem" }}>Aguardando aprovação</h2>
                <p style={{ color:"var(--text-muted)", margin:"0 0 1.5rem", fontSize:"0.875rem", lineHeight:1.6 }}>Um administrador irá aprovar seu acesso em breve.</p>
                <button className="btn-ghost" onClick={()=>window.location.reload()} style={{ width:"100%", justifyContent:"center" }}>Verificar novamente</button>
              </div>
            ) : isBanned ? (
              <div style={{ textAlign:"center" }}><div style={{ width:64, height:64, borderRadius:18, background:"#fef2f2", border:"1.5px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}><i className="ti ti-ban" style={{ fontSize:34, color:"#ef4444" }} aria-hidden="true"/></div><h2 style={{ margin:"0 0 0.75rem" }}>Acesso suspenso</h2><p style={{ color:"var(--text-muted)", margin:0 }}>Entre em contato com o administrador.</p></div>
            ) : (
              <>
                <div style={{ textAlign:"center", marginBottom:"2rem" }}><h2 style={{ margin:"0 0 0.375rem", fontSize:"1.625rem" }}>Bem-vindo(a)!</h2><p style={{ color:"var(--text-muted)", margin:0, fontSize:"0.875rem" }}>Entre com sua conta Google pessoal</p></div>
                <a href={authData?.url||"#"} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.875rem", padding:"0.875rem 1.5rem", background:"white", border:"1.5px solid var(--border)", borderRadius:"0.875rem", textDecoration:"none", color:"var(--text)", fontWeight:600, fontSize:"0.9rem", width:"100%", transition:"all 0.2s ease", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
                  onMouseOver={e=>{e.currentTarget.style.borderColor="#4CAF82";e.currentTarget.style.boxShadow="0 4px 16px rgba(76,175,130,0.2)"}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Entrar com Google
                </a>
                <p style={{ textAlign:"center", marginTop:"1.25rem", fontSize:"0.775rem", color:"var(--text-muted)", lineHeight:1.6 }}>Acesso restrito. Novos usuários precisam de aprovação.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
