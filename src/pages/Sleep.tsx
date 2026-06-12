import { useState } from "react";
import { trpc } from "../lib/trpc";
import { formatDate } from "../lib/utils";
import { Moon, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const QUALITY = [
  { icon:"ti-mood-sad", label:"Péssima", color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
  { icon:"ti-mood-confuzed", label:"Ruim", color:"#f97316", bg:"#fff7ed", border:"#fed7aa" },
  { icon:"ti-mood-neutral", label:"Ok", color:"#eab308", bg:"#fefce8", border:"#fde68a" },
  { icon:"ti-mood-smile", label:"Boa", color:"#22c55e", bg:"#f0fdf4", border:"#bbf7d0" },
  { icon:"ti-mood-happy", label:"Ótima", color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
];
function QualityIcon({ q, size = 24 }: { q: number; size?: number }) {
  const item = QUALITY[q-1];
  if (!item) return null;
  return (
    <span style={{ width:size+10, height:size+10, borderRadius:Math.round((size+10)*0.28), background:item.bg, border:`1px solid ${item.border}`, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <i className={`ti ${item.icon}`} style={{ fontSize:size, color:item.color }} aria-hidden="true"/>
    </span>
  );
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SleepPage() {
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: today, isLoading } = trpc.sleep.today.useQuery();
  const { data: history = [] } = trpc.sleep.history.useQuery({ days: 30 });

  const upsert = trpc.sleep.upsert.useMutation({
    onSuccess: () => {
      utils.sleep.today.invalidate();
      utils.sleep.history.invalidate();
      setEditing(false);
      toast.success("Sono registrado!");
    },
  });

  const del = trpc.sleep.delete.useMutation({
    onSuccess: () => {
      utils.sleep.today.invalidate();
      utils.sleep.history.invalidate();
      toast.success("Registro removido");
    },
  });

  function startEdit() {
    setBedtime(today?.bedtime ?? "23:00");
    setWakeTime(today?.wakeTime ?? "07:00");
    setQuality(today?.quality ?? null);
    setEditing(true);
  }

  function handleSubmit() {
    upsert.mutate({ bedtime, wakeTime, quality: quality ?? undefined });
  }

  const avgDuration = history.length > 0
    ? Math.round(history.reduce((a, e) => a + e.durationMinutes, 0) / history.length)
    : null;

  const showForm = !today || editing;

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Moon size={28} color="var(--primary)" /> Sono
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Registre seu sono diário</p>
      </div>

      {/* Stats */}
      {avgDuration && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Média (30d)", value: formatDuration(avgDuration) },
            { label: "Registros", value: history.length },
            { label: "Meta recomendada", value: "8h" },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today */}
      <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Carregando...</div>
        ) : showForm ? (
          <>
            <p style={{ margin: "0 0 1.25rem", fontWeight: 600 }}>{editing ? "Atualizar sono de hoje" : "Registrar sono de hoje"}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Horário de dormir</label>
                <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Horário de acordar</label>
                <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem 0.875rem", border: "1.5px solid var(--border)", borderRadius: "0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.75rem" }}>Qualidade do sono</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {QUALITY.map((q, i) => (
                  <button key={i} onClick={() => setQuality(i + 1)}
                    style={{ flex: 1, padding: "0.625rem 0.25rem", border: `2px solid ${quality === i + 1 ? q.color : "var(--border)"}`, borderRadius: "0.75rem", background: quality === i + 1 ? q.bg : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width:34, height:34, borderRadius:10, background:q.bg, border:`1px solid ${q.border}`, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                      <i className={`ti ${q.icon}`} style={{ fontSize:20, color:q.color }} aria-hidden="true"/>
                    </span>
                    <span style={{ fontSize:"0.62rem", fontWeight:500, color: quality === i+1 ? q.color : "var(--text-muted)" }}>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={upsert.isPending} style={{ flex: 1, justifyContent: "center" }}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </button>
              {editing && <button className="btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: 72, height: 72, borderRadius: "1rem", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", flexShrink: 0 }}>
              <i className="ti ti-moon" style={{ fontSize:38, color:"#A78BFA" }} aria-hidden="true"/>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 600, fontSize: "1.1rem" }}>
                {formatDuration(today!.durationMinutes)} de sono
              </p>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                {today!.bedtime} → {today!.wakeTime}
                {today!.quality ? <span style={{ marginLeft:6, verticalAlign:"middle", display:"inline-flex" }}><QualityIcon q={today!.quality} size={14}/></span> : null}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn-ghost" onClick={startEdit} style={{ padding: "0.5rem" }}><Pencil size={16} /></button>
              <button className="btn-ghost" onClick={() => del.mutate({ id: today!.id })} style={{ padding: "0.5rem", color: "#ef4444", borderColor: "#fecaca" }}><Trash2 size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, margin: "0 0 1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Histórico</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {history.slice(0, 14).map(entry => (
              <div key={entry.id} className="card" style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ width:34, height:34, borderRadius:10, background:"#f5f3ff", border:"1px solid #ddd6fe", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <i className="ti ti-moon" style={{ fontSize:18, color:"#A78BFA" }} aria-hidden="true"/>
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{formatDuration(entry.durationMinutes)}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{entry.bedtime} → {entry.wakeTime}</span>
                </div>
                {entry.quality ? <QualityIcon q={entry.quality} size={16}/> : null}
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{formatDate(entry.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
