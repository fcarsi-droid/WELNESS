import { useState } from "react";
import { trpc } from "../lib/trpc";
import { ChefHat, Plus, Heart, Star, MessageCircle, X, Clock, Flame } from "lucide-react";
import { formatRelativeTime } from "../lib/utils";
import toast from "react-hot-toast";

const CATEGORIES = ["Café da manhã","Almoço","Jantar","Lanche","Sobremesa","Vegana","Vegetariana","Fit"];

export default function RecipesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title:"", description:"", ingredients:"", instructions:"", category:"", prepTimeMinutes:"", calories:"" });

  const utils = trpc.useUtils();
  const { data: recipes = [] } = trpc.recipes.list.useQuery();
  const selected = recipes.find(r => r.id === selectedId);

  const create = trpc.recipes.create.useMutation({
    onSuccess: () => { utils.recipes.list.invalidate(); setShowForm(false); setForm({ title:"", description:"", ingredients:"", instructions:"", category:"", prepTimeMinutes:"", calories:"" }); toast.success("Receita publicada!"); },
  });

  const like = trpc.recipes.like.useMutation({ onSuccess: () => utils.recipes.list.invalidate() });

  function handleSubmit() {
    if (!form.title || !form.ingredients || !form.instructions) return toast.error("Preencha os campos obrigatórios");
    create.mutate({ ...form, prepTimeMinutes: form.prepTimeMinutes ? parseInt(form.prepTimeMinutes) : undefined, calories: form.calories ? parseFloat(form.calories) : undefined });
  }

  const inputStyle = { width:"100%", padding:"0.625rem 0.875rem", border:"1.5px solid var(--border)", borderRadius:"0.75rem", fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" as const };
  const labelStyle = { display:"block" as const, fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.3rem" };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h1 style={{ margin:"0 0 0.25rem", fontSize:"1.75rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <ChefHat size={28} color="#2DD4BF" /> Receitas
          </h1>
          <p style={{ margin:0, color:"var(--text-muted)" }}>Compartilhe e descubra receitas saudáveis</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)} style={{ background:"linear-gradient(135deg, #2DD4BF, #0d9488)" }}>
          <Plus size={16} /> Nova receita
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card fade-in" style={{ padding:"1.75rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <h3 style={{ margin:0, fontFamily:"'DM Sans', sans-serif", fontSize:"1rem", fontWeight:600 }}>Nova receita</h3>
            <button className="btn-ghost" onClick={() => setShowForm(false)} style={{ padding:"0.375rem" }}><X size={16}/></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.875rem", marginBottom:"0.875rem" }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={labelStyle}>Título *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ex: Salada caesar" style={inputStyle}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={labelStyle}>Descrição</label>
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Breve descrição da receita" style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...inputStyle, background:"white"}}>
                <option value="">Selecionar</option>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
              <div>
                <label style={labelStyle}>Preparo (min)</label>
                <input type="number" value={form.prepTimeMinutes} onChange={e=>setForm(f=>({...f,prepTimeMinutes:e.target.value}))} placeholder="30" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Calorias</label>
                <input type="number" value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))} placeholder="350" style={inputStyle}/>
              </div>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={labelStyle}>Ingredientes * (um por linha)</label>
              <textarea value={form.ingredients} onChange={e=>setForm(f=>({...f,ingredients:e.target.value}))} placeholder="2 xícaras de farinha&#10;1 colher de sal&#10;..." style={{...inputStyle, minHeight:100, resize:"vertical"}}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={labelStyle}>Modo de preparo *</label>
              <textarea value={form.instructions} onChange={e=>setForm(f=>({...f,instructions:e.target.value}))} placeholder="Passo 1: ...&#10;Passo 2: ..." style={{...inputStyle, minHeight:120, resize:"vertical"}}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={create.isPending} style={{ background:"linear-gradient(135deg, #2DD4BF, #0d9488)" }}>
              {create.isPending ? "Publicando..." : "Publicar receita"}
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Recipe detail modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={() => setSelectedId(null)}>
          <div style={{ background:"white", borderRadius:"1.25rem", maxWidth:640, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2rem" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.25rem" }}>
              <div>
                <h2 style={{ margin:"0 0 0.25rem", fontSize:"1.5rem" }}>{selected.title}</h2>
                {selected.description && <p style={{ margin:0, color:"var(--text-muted)", fontSize:"0.875rem" }}>{selected.description}</p>}
              </div>
              <button className="btn-ghost" onClick={() => setSelectedId(null)} style={{ padding:"0.375rem", flexShrink:0 }}><X size={18}/></button>
            </div>
            <div style={{ display:"flex", gap:"1rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
              {selected.category && <span className="badge" style={{ background:"#e0fdfa", color:"#0d9488" }}>{selected.category}</span>}
              {selected.prepTimeMinutes && <span style={{ fontSize:"0.8rem", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"0.3rem" }}><Clock size={13}/> {selected.prepTimeMinutes} min</span>}
              {selected.calories && <span style={{ fontSize:"0.8rem", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"0.3rem" }}><Flame size={13}/> {selected.calories} kcal</span>}
            </div>
            <div style={{ marginBottom:"1.25rem" }}>
              <h3 style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--text-muted)", margin:"0 0 0.75rem" }}>Ingredientes</h3>
              <ul style={{ margin:0, paddingLeft:"1.25rem", lineHeight:1.8, fontSize:"0.9rem" }}>
                {selected.ingredients.split("\n").filter(Boolean).map((ing,i) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
            <div>
              <h3 style={{ fontFamily:"'DM Sans', sans-serif", fontSize:"0.875rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--text-muted)", margin:"0 0 0.75rem" }}>Modo de preparo</h3>
              <ol style={{ margin:0, paddingLeft:"1.25rem", lineHeight:1.8, fontSize:"0.9rem" }}>
                {selected.instructions.split("\n").filter(Boolean).map((step,i) => <li key={i} style={{ marginBottom:"0.5rem" }}>{step.replace(/^passo \d+:?\s*/i,"")}</li>)}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Recipe grid */}
      {recipes.length === 0 ? (
        <div style={{ textAlign:"center", padding:"4rem 2rem", color:"var(--text-muted)" }}>
          <p style={{ fontSize:"3rem", margin:"0 0 1rem" }}>👨‍🍳</p>
          <p style={{ marginBottom:"1.5rem" }}>Nenhuma receita ainda. Seja o primeiro a compartilhar!</p>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ background:"linear-gradient(135deg, #2DD4BF, #0d9488)" }}><Plus size={16}/> Adicionar receita</button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:"1rem" }}>
          {recipes.map(recipe => (
            <div key={recipe.id} className="card" style={{ padding:"1.25rem", cursor:"pointer" }} onClick={() => setSelectedId(recipe.id)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
                <h3 style={{ margin:0, fontFamily:"'DM Sans', sans-serif", fontSize:"0.95rem", fontWeight:600, flex:1, marginRight:"0.5rem" }}>{recipe.title}</h3>
                {recipe.category && <span className="badge" style={{ background:"#e0fdfa", color:"#0d9488", flexShrink:0 }}>{recipe.category}</span>}
              </div>
              {recipe.description && <p style={{ margin:"0 0 0.875rem", color:"var(--text-muted)", fontSize:"0.8rem", lineHeight:1.5 }}>{recipe.description}</p>}
              <div style={{ display:"flex", gap:"1rem", fontSize:"0.75rem", color:"var(--text-muted)" }}>
                {recipe.prepTimeMinutes && <span style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}><Clock size={12}/> {recipe.prepTimeMinutes}min</span>}
                {recipe.calories && <span style={{ display:"flex", alignItems:"center", gap:"0.3rem" }}><Flame size={12}/> {recipe.calories}kcal</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
