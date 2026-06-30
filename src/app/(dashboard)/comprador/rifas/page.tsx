"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore } from "@/store";
export default function RifasPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [rifas, setRifas]     = useState<any[]>([]);
  const [puntos, setPuntos]   = useState(0);
  const [userId, setUserId]   = useState("");
  const [cargando, setCargando] = useState(true);
  const [participando, setParticipando] = useState<string | null>(null);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const [{ data: perfil }, { data: r }] = await Promise.all([
        sb.from("usuarios").select("*").eq("id", user.id).single(),
        sb.from("rifas").select("*, participaciones:participaciones_rifas(usuario_id,tickets)").eq("activa", true).order("fecha_sorteo"),
      ]);
      if (perfil) { setUsuario(perfil); setPuntos(perfil.puntos_acumulados ?? 0); }
      setRifas(r ?? []); setCargando(false);
    });
  }, [setUsuario]);

  async function participar(rifaId: string, ptsReq: number) {
    if (puntos < ptsReq) { alert("No tenés suficientes puntos para esta rifa."); return; }
    setParticipando(rifaId);
    const sb = createClient();
    const { data: exist } = await sb.from("participaciones_rifas").select("id,tickets").eq("rifa_id", rifaId).eq("usuario_id", userId).single();
    if (exist) {
      await sb.from("participaciones_rifas").update({ tickets: exist.tickets + 1 }).eq("id", exist.id);
    } else {
      await sb.from("participaciones_rifas").insert({ rifa_id: rifaId, usuario_id: userId, tickets: 1 });
    }
    await sb.from("usuarios").update({ puntos_acumulados: puntos - ptsReq }).eq("id", userId);
    await sb.from("movimientos_puntos").insert({ usuario_id: userId, puntos: -ptsReq, concepto: "Ticket rifa" });
    setPuntos(p => p - ptsReq);
    setRifas(prev => prev.map((r: any) => r.id === rifaId ? { ...r, _participado: true } : r));
    setParticipando(null);
    alert("✅ ¡Ya tenés tu ticket! Mucha suerte 🍀");
  }

  return (
    <PageShell title="Rifas y sorteos 🎁">
      <div style={{ padding:"16px" }}>
        <div style={{ background:"linear-gradient(135deg,var(--accent),var(--teal))",borderRadius:20,padding:"16px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div><div style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.7)" }}>Tus puntos disponibles</div><div style={{ fontSize:30,fontWeight:900,color:"#fff",letterSpacing:-1 }}>{puntos.toLocaleString()} pts</div></div>
          <span style={{ fontSize:40 }}>⭐</span>
        </div>
        {cargando && <p style={{ textAlign:"center",color:"var(--muted)",padding:"40px 0" }}>Cargando rifas...</p>}
        {!cargando && rifas.length === 0 && (
          <div style={{ textAlign:"center",padding:"60px 0" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🎁</div>
            <p style={{ fontWeight:700,fontSize:16 }}>Sin rifas activas</p>
            <p style={{ fontSize:13,color:"var(--muted)",marginTop:4 }}>¡Pronto habrá sorteos increíbles!</p>
          </div>
        )}
        {rifas.map((r: any) => {
          const miPart = r.participaciones?.find((p: any) => p.usuario_id === userId);
          const totalTickets = r.participaciones?.reduce((s: number, p: any) => s + p.tickets, 0) ?? 0;
          const puedo = puntos >= r.puntos_requeridos;
          const fechaSorteo = new Date(r.fecha_sorteo);
          return (
            <div key={r.id} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:18,marginBottom:12,boxShadow:"var(--shadow-sm)",overflow:"hidden",position:"relative" }}>
              {r.imagen_url && <img src={r.imagen_url} alt={r.titulo} style={{ width:"100%",height:140,objectFit:"cover",borderRadius:12,marginBottom:12 }} />}
              <div style={{ fontWeight:900,fontSize:16,letterSpacing:-0.3,marginBottom:6 }}>{r.titulo}</div>
              {r.descripcion && <p style={{ fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:10 }}>{r.descripcion}</p>}
              <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:12 }}>
                <span style={{ padding:"5px 12px",borderRadius:100,fontSize:12,fontWeight:700,background:"var(--accentBg)",border:"1px solid rgba(91,79,245,0.3)",color:"var(--accent)" }}>🎟️ {r.puntos_requeridos} pts por ticket</span>
                <span style={{ padding:"5px 12px",borderRadius:100,fontSize:12,fontWeight:700,background:"var(--tealBg)",border:"1px solid var(--tealBorder)",color:"var(--teal)" }}>👥 {totalTickets} tickets vendidos</span>
              </div>
              <div style={{ fontSize:12,color:"var(--muted)",marginBottom:12 }}>📅 Sorteo: {fechaSorteo.toLocaleDateString("es-SV",{day:"numeric",month:"long",year:"numeric"})}</div>
              {miPart && <div style={{ padding:"8px 14px",borderRadius:10,background:"var(--tealBg)",border:"1px solid var(--tealBorder)",fontSize:13,fontWeight:600,color:"var(--teal)",marginBottom:10 }}>✅ Tenés {miPart.tickets} ticket{miPart.tickets>1?"s":""}</div>}
              <button onClick={() => participar(r.id, r.puntos_requeridos)} disabled={!puedo || participando === r.id}
                style={{ width:"100%",padding:"13px",borderRadius:100,border:"none",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:14,cursor:puedo?"pointer":"not-allowed",background:puedo?"var(--accent)":"var(--bg3)",color:puedo?"#fff":"var(--muted)",boxShadow:puedo?"0 4px 14px rgba(91,79,245,0.3)":"none",transition:"all .2s" }}>
                {participando === r.id ? "Procesando..." : !puedo ? `Necesitás ${r.puntos_requeridos - puntos} pts más` : miPart ? "Comprar otro ticket" : "Participar con puntos"}
              </button>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}