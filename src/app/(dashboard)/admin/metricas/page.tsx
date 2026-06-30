"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore } from "@/store";
export default function AdminMetricasPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [metrics, setMetrics] = useState<any>({});
  const [recent, setRecent]   = useState<any[]>([]);
  const [load, setLoad]       = useState(true);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: u } = await sb.from("usuarios").select("*").eq("id", user.id).single();
      if (u) setUsuario(u);
      const hoy = new Date().toISOString().split("T")[0];
      const [{ count: pedHoy }, { count: pedTotal }, { count: vendedores }, { count: compradores }, { count: tiendasActivas }, { data: recientes }] = await Promise.all([
        sb.from("pedidos").select("id",{count:"exact",head:true}).gte("creado_en", hoy),
        sb.from("pedidos").select("id",{count:"exact",head:true}),
        sb.from("usuarios").select("id",{count:"exact",head:true}).eq("rol","vendedor"),
        sb.from("usuarios").select("id",{count:"exact",head:true}).eq("rol","comprador"),
        sb.from("tiendas").select("id",{count:"exact",head:true}).eq("activa",true),
        sb.from("pedidos").select("*, tienda:tiendas(nombre), comprador:usuarios(nombre)").order("creado_en",{ascending:false}).limit(8),
      ]);
      const { data: ingrD } = await sb.from("pedidos").select("total").eq("estado","entregado");
      const ingrTotal = (ingrD??[]).reduce((s: number,p: any)=>s+(p.total??0),0);
      setMetrics({ pedHoy:pedHoy??0, pedTotal:pedTotal??0, vendedores:vendedores??0, compradores:compradores??0, tiendasActivas:tiendasActivas??0, ingrTotal });
      setRecent(recientes??[]); setLoad(false);
    });
  }, [setUsuario]);
  const KPIS = [
    { label:"Pedidos hoy",    val:metrics.pedHoy,     icon:"📦", color:"var(--teal)" },
    { label:"Total pedidos",  val:metrics.pedTotal,   icon:"🛒", color:"var(--accent)" },
    { label:"Vendedores",     val:metrics.vendedores, icon:"🏪", color:"#f59e0b" },
    { label:"Compradores",    val:metrics.compradores,icon:"👤", color:"var(--teal)" },
    { label:"Tiendas activas",val:metrics.tiendasActivas,icon:"🟢",color:"#22c55e"},
    { label:"Ingresos totales",val:`$${(metrics.ingrTotal??0).toFixed(0)}`,icon:"💵",color:"var(--accent)"},
  ];
  const EST: Record<string,string> = { pendiente:"#f59e0b",confirmado:"var(--teal)",en_camino:"var(--teal)",entregado:"var(--teal)",cancelado:"#dc2626" };
  return (
    <PageShell title="Dashboard admin">
      <div style={{ padding:"16px",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10 }}>
          {KPIS.map(k=>(
            <div key={k.label} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:"16px 14px",boxShadow:"var(--shadow-sm)" }}>
              <div style={{ fontSize:26 }}>{k.icon}</div>
              <div style={{ fontWeight:900,fontSize:26,letterSpacing:-1,color:k.color,marginTop:6 }}>{load?"—":k.val}</div>
              <div style={{ fontSize:12,color:"var(--muted)",marginTop:3 }}>{k.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"var(--card)",borderRadius:20,padding:18,border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)" }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>Pedidos recientes</div>
          {recent.length===0 && !load && <p style={{ color:"var(--muted)",fontSize:13 }}>Sin pedidos aún.</p>}
          {recent.map((p: any)=>(
            <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight:700,fontSize:13 }}>{p.tienda?.nombre??""} ← {p.comprador?.nombre??""}</div>
                <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{new Date(p.creado_en).toLocaleString("es-SV",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
              <div style={{ textAlign:"right" as const }}>
                <div style={{ fontWeight:900,fontSize:14,color:"var(--teal)" }}>${p.total?.toFixed(2)}</div>
                <div style={{ fontSize:10,fontWeight:700,color:EST[p.estado]??"var(--muted)",marginTop:2 }}>{p.estado}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}