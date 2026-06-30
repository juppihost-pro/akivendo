"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore } from "@/store";
export default function AdminRifasPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [rifas, setRifas] = useState<any[]>([]);
  const [form, setForm]   = useState({ titulo:"",descripcion:"",puntos_requeridos:100,fecha_sorteo:"" });
  const [load, setLoad]   = useState(true);
  const sb = createClient();
  async function cargar() { const {data}=await sb.from("rifas").select("*, participaciones:participaciones_rifas(usuario_id,tickets)").order("fecha_sorteo"); setRifas(data??[]); setLoad(false); }
  useEffect(()=>{ sb.auth.getUser().then(async({data:{user}})=>{ if(!user) return; const {data:u}=await sb.from("usuarios").select("*").eq("id",user.id).single(); if(u) setUsuario(u); cargar(); }); },[]);
  async function crearRifa() {
    if(!form.titulo||!form.fecha_sorteo) return;
    await sb.from("rifas").insert({...form,activa:true});
    setForm({titulo:"",descripcion:"",puntos_requeridos:100,fecha_sorteo:""}); cargar();
  }
  async function toggleActiva(r: any) { await sb.from("rifas").update({activa:!r.activa}).eq("id",r.id); cargar(); }
  const inp: React.CSSProperties = {width:"100%",padding:"11px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--bg3)",fontFamily:"Montserrat,sans-serif",fontSize:14,color:"var(--text)",outline:"none"};
  const lbl: React.CSSProperties = {display:"block",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:4};
  return (
    <PageShell title="Rifas y sorteos">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"var(--card)",borderRadius:18,padding:18,border:"1px solid var(--border)"}}>
          <div style={{fontWeight:800,fontSize:14,marginBottom:12}}>Crear nueva rifa</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div><label style={lbl}>Título del premio</label><input value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} placeholder="Ej. Cesta de productos" style={inp} /></div>
            <div><label style={lbl}>Descripción</label><textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción del premio..." style={{...inp,height:64,resize:"none"}} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Puntos por ticket</label><input type="number" value={form.puntos_requeridos} onChange={e=>setForm({...form,puntos_requeridos:+e.target.value})} style={inp} /></div>
              <div><label style={lbl}>Fecha del sorteo</label><input type="date" value={form.fecha_sorteo} onChange={e=>setForm({...form,fecha_sorteo:e.target.value})} style={inp} /></div>
            </div>
            <button onClick={crearRifa} disabled={!form.titulo||!form.fecha_sorteo} style={{padding:"12px",borderRadius:100,border:"none",background:"var(--accent)",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(91,79,245,0.3)",opacity:(!form.titulo||!form.fecha_sorteo)?0.65:1}}>🎁 Crear rifa</button>
          </div>
        </div>
        {load&&<p style={{textAlign:"center",color:"var(--muted)",padding:"32px 0"}}>Cargando...</p>}
        {rifas.map(r=>{
          const tickets=(r.participaciones??[]).reduce((s: number,p: any)=>s+p.tickets,0);
          const participantes=(r.participaciones??[]).length;
          return (
            <div key={r.id} style={{background:"var(--card)",border:`1px solid ${r.activa?"var(--accentBg)":"var(--border)"}`,borderRadius:18,padding:16,boxShadow:"var(--shadow-sm)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontWeight:900,fontSize:15}}>{r.titulo}</div>
                <span style={{padding:"4px 12px",borderRadius:100,fontSize:11,fontWeight:700,background:r.activa?"var(--accentBg)":"var(--bg3)",color:r.activa?"var(--accent)":"var(--muted)",border:`1px solid ${r.activa?"rgba(91,79,245,0.3)":"var(--border)"}`}}>{r.activa?"Activa":"Inactiva"}</span>
              </div>
              {r.descripcion&&<p style={{fontSize:13,color:"var(--text2)",marginBottom:10}}>{r.descripcion}</p>}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:600,color:"var(--muted)"}}>🎟️ {r.puntos_requeridos} pts/ticket</span>
                <span style={{fontSize:12,fontWeight:600,color:"var(--muted)"}}>👥 {participantes} participantes · {tickets} tickets</span>
                <span style={{fontSize:12,fontWeight:600,color:"var(--muted)"}}>📅 {new Date(r.fecha_sorteo).toLocaleDateString("es-SV")}</span>
              </div>
              <button onClick={()=>toggleActiva(r)} style={{width:"100%",padding:"10px",borderRadius:100,border:`1.5px solid ${r.activa?"#dc2626":"var(--teal)"}`,background:"transparent",color:r.activa?"#dc2626":"var(--teal)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                {r.activa?"⏸ Desactivar rifa":"▶ Activar rifa"}
              </button>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}