"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store";
export default function AdminVendedoresPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [compradores, setCompradores] = useState<any[]>([]);
  const [tab, setTab] = useState<"vendedores"|"compradores">("vendedores");
  const [load, setLoad] = useState(true);
  useEffect(()=>{
    const sb = createClient();
    sb.auth.getUser().then(async({data:{user}})=>{
      if(!user) return;
      const {data:u}=await sb.from("usuarios").select("*").eq("id",user.id).single();
      if(u) setUsuario(u);
      const [{data:v},{data:c}]=await Promise.all([
        sb.from("usuarios").select("*, tiendas(id,nombre,activa,categoria_id)").eq("rol","vendedor").order("creado_en",{ascending:false}),
        sb.from("usuarios").select("*").eq("rol","comprador").order("puntos_acumulados",{ascending:false}).limit(50),
      ]);
      setVendedores(v??[]); setCompradores(c??[]); setLoad(false);
    });
  },[setUsuario]);
  async function cambiarRol(uid: string, nuevoRol: string) {
    const sb = createClient();
    await sb.from("usuarios").update({rol:nuevoRol}).eq("id",uid);
    setVendedores(p=>p.map((u: any)=>u.id===uid?{...u,rol:nuevoRol}:u));
  }
  const NV: Record<string,any> = {frecuente:{v:"teal",e:"🛍️"},oro:{v:"gold",e:"🥇"},platinum:{v:"purple",e:"💎"},diamante:{v:"cyan",e:"✨"}};
  return (
    <PageShell title="Usuarios">
      <div style={{padding:"16px"}}>
        <div style={{display:"flex",gap:8,marginBottom:16,background:"var(--bg3)",borderRadius:14,padding:4}}>
          {(["vendedores","compradores"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",background:tab===t?"var(--card)":"transparent",color:tab===t?"var(--text)":"var(--muted)",boxShadow:tab===t?"var(--shadow-sm)":"none",textTransform:"capitalize"}}>
              {t==="vendedores"?"🏪 Vendedores":"🛍️ Compradores"}
            </button>
          ))}
        </div>
        {load&&<p style={{textAlign:"center",color:"var(--muted)",padding:"40px 0"}}>Cargando...</p>}
        {!load&&tab==="vendedores"&&vendedores.map((v: any)=>{
          const tienda=v.tiendas?.[0];
          return (
            <div key={v.id} style={{background:"var(--card)",border:`1px solid ${tienda?.activa?"var(--tealBorder)":"var(--border)"}`,borderRadius:18,padding:16,marginBottom:10,boxShadow:"var(--shadow-sm)"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{fontSize:28,flexShrink:0}}>🏪</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900,fontSize:14}}>{v.nombre}</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{v.email}</div>
                  {tienda&&<div style={{fontSize:12,marginTop:4,fontWeight:600,color:tienda.activa?"var(--teal)":"var(--muted)"}}>{tienda.activa?"🟢":"⚪"} {tienda.nombre}</div>}
                </div>
                <Badge variant={tienda?.activa?"teal":"gray"}>{tienda?.activa?"Activo":"Sin tienda"}</Badge>
              </div>
            </div>
          );
        })}
        {!load&&tab==="compradores"&&compradores.map((c: any)=>(
          <div key={c.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:14,marginBottom:8,display:"flex",alignItems:"center",gap:12,boxShadow:"var(--shadow-sm)"}}>
            <div style={{fontSize:22}}>👤</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{c.nombre}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{c.email}</div></div>
            <div style={{textAlign:"right" as const}}>
              <span style={{fontWeight:800,fontSize:13,color:"var(--teal)"}}>⭐ {c.puntos_acumulados}</span>
              {c.nivel&&<div style={{marginTop:4}}><Badge variant={NV[c.nivel]?.v??"gray"}>{NV[c.nivel]?.e} {c.nivel}</Badge></div>}
            </div>
          </div>
        ))}
        <div style={{marginTop:20,padding:"16px 18px",borderRadius:16,background:"var(--bg3)",border:"1px solid var(--border)"}}>
          <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Cambiar rol de usuario (SQL Editor en Supabase):</div>
          <code style={{display:"block",padding:"8px 12px",background:"var(--bg2)",borderRadius:8,fontSize:11,color:"var(--teal)",fontFamily:"monospace",lineHeight:1.6}}>
            {"UPDATE usuarios SET rol = 'admin'"}
            <br/>{"WHERE email = 'correo@ejemplo.com';"}
          </code>
        </div>
      </div>
    </PageShell>
  );
}