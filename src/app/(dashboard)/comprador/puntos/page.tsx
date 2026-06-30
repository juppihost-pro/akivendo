"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { NIVELES } from "@/lib/constants";
import { progresoNivel } from "@/lib/utils";
import { useAuthStore } from "@/store";
export default function PuntosPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [puntos, setPuntos] = useState(0);
  const [nivel, setNivel]   = useState("frecuente");
  const [movs, setMovs]     = useState<any[]>([]);
  const [load, setLoad]     = useState(true);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: p }, { data: m }] = await Promise.all([
        sb.from("usuarios").select("*").eq("id", user.id).single(),
        sb.from("movimientos_puntos").select("*").eq("usuario_id", user.id).order("creado_en",{ascending:false}).limit(30),
      ]);
      if (p) { setUsuario(p); setPuntos(p.puntos_acumulados ?? 0); setNivel(p.nivel ?? "frecuente"); }
      setMovs(m ?? []); setLoad(false);
      sb.channel("pts-rt").on("postgres_changes",{event:"UPDATE",schema:"public",table:"usuarios",filter:`id=eq.${user.id}`},(pl: any)=>{
        setPuntos(pl.new.puntos_acumulados); setNivel(pl.new.nivel);
      }).subscribe();
    });
  }, [setUsuario]);
  const nv   = NIVELES[nivel as keyof typeof NIVELES] ?? NIVELES.frecuente;
  const prog = progresoNivel(puntos);
  const keys = Object.keys(NIVELES) as (keyof typeof NIVELES)[];
  const idx  = keys.indexOf(nivel as any);
  const nextKey = idx < keys.length - 1 ? keys[idx + 1] : null;
  const nextNv  = nextKey ? NIVELES[nextKey] : null;
  return (
    <PageShell title="Mis puntos">
      <div style={{ padding:"16px",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ background:"var(--card)",border:`2px solid ${nv.color}`,borderRadius:24,padding:24,textAlign:"center",boxShadow:`0 8px 32px ${nv.color}25` }}>
          <div style={{ fontSize:52 }}>{nv.emoji}</div>
          <div style={{ fontWeight:900,fontSize:56,letterSpacing:-4,lineHeight:1,color:nv.color,marginTop:6 }}>
            {load ? "—" : puntos.toLocaleString()}
          </div>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--muted)",marginTop:4 }}>puntos akivendo</div>
          <div style={{ marginTop:10 }}>
            <span style={{ padding:"5px 16px",borderRadius:100,fontSize:12,fontWeight:700,background:`${nv.color}18`,border:`1px solid ${nv.color}40`,color:nv.color }}>{nv.label}</span>
          </div>
          {nextNv && (
            <div style={{ marginTop:18 }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:600,color:"var(--muted)",marginBottom:6 }}>
                <span>Hacia {nextNv.emoji} {nextNv.label}</span>
                <span style={{ color:nv.color }}>{prog}%</span>
              </div>
              <div style={{ height:8,background:"var(--bg3)",borderRadius:100,overflow:"hidden" }}>
                <div style={{ height:"100%",borderRadius:100,width:`${prog}%`,background:`linear-gradient(90deg,${nv.color},${nextNv.color})`,transition:"width 1s ease" }} />
              </div>
              <div style={{ fontSize:11,color:"var(--muted)",marginTop:4,textAlign:"right" }}>{nextNv.min - puntos} pts para llegar</div>
            </div>
          )}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
          {keys.map(k => { const v = NIVELES[k]; const act = nivel===k; return (
            <div key={k} style={{ background:act?`${v.color}15`:"var(--card)",border:`1.5px solid ${act?v.color:"var(--border)"}`,borderRadius:14,padding:"12px 4px",textAlign:"center" }}>
              <div style={{ fontSize:22 }}>{v.emoji}</div>
              <div style={{ fontSize:9,fontWeight:800,marginTop:3,color:act?v.color:"var(--text2)" }}>{v.label.split(" ").slice(-1)[0]}</div>
              <div style={{ fontSize:9,color:"var(--muted)",marginTop:1 }}>{v.min}+</div>
            </div>
          ); })}
        </div>
        <div style={{ background:"var(--card)",borderRadius:18,padding:16,border:"1px solid var(--border)" }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>¿Para qué sirven los puntos?</div>
          {[{e:"🎟️",t:"Participar en rifas",d:"Canjeá puntos por tickets en sorteos exclusivos"},{e:"🎁",t:"Canjear productos",d:"Ciertos productos disponibles solo con puntos"},{e:"🏆",t:"Ranking akivendo",d:"Mientras más comprás, mejor nivel y más beneficios"}].map(u=>(
            <div key={u.t} style={{ display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:24 }}>{u.e}</span>
              <div><div style={{ fontWeight:700,fontSize:13 }}>{u.t}</div><div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>{u.d}</div></div>
            </div>
          ))}
        </div>
        {movs.length > 0 && <>
          <div style={{ fontWeight:800,fontSize:14 }}>Historial</div>
          {movs.map((m: any) => (
            <div key={m.id} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div><div style={{ fontWeight:700,fontSize:13 }}>{m.concepto}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{new Date(m.creado_en).toLocaleString("es-SV",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div></div>
              <span style={{ fontWeight:900,fontSize:18,color:m.puntos>0?"var(--teal)":"#dc2626" }}>{m.puntos>0?"+":""}{m.puntos}</span>
            </div>
          ))}
        </>}
      </div>
    </PageShell>
  );
}