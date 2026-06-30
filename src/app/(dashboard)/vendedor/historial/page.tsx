"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore } from "@/store";
export default function VendedorHistorialPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [stats, setStats]     = useState({ total:0, ingresos:0, hoy:0 });
  const [load, setLoad]       = useState(true);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: u }, { data: t }] = await Promise.all([
        sb.from("usuarios").select("*").eq("id", user.id).single(),
        sb.from("tiendas").select("id").eq("vendedor_id", user.id).single(),
      ]);
      if (u) setUsuario(u);
      if (!t) { setLoad(false); return; }
      const { data: p } = await sb.from("pedidos").select("*, detalle:detalle_pedido(*, producto:productos(nombre))").eq("tienda_id", t.id).order("creado_en",{ascending:false}).limit(100);
      const todos = p ?? [];
      const entregados = todos.filter((x: any) => x.estado === "entregado");
      const hoy = new Date().toISOString().split("T")[0];
      const hoyN = entregados.filter((x: any) => x.creado_en.startsWith(hoy)).length;
      setStats({ total:entregados.length, ingresos:entregados.reduce((s: number,x: any)=>s+(x.total??0),0), hoy:hoyN });
      setPedidos(todos); setLoad(false);
    });
  }, [setUsuario]);
  const estilo = { background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"18px 16px",textAlign:"center" as const };
  return (
    <PageShell title="Mis ventas">
      <div style={{ padding:"16px",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
          <div style={estilo}><div style={{ fontSize:26,fontWeight:900,color:"var(--teal)",letterSpacing:-1 }}>{stats.total}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>Entregas</div></div>
          <div style={estilo}><div style={{ fontSize:22,fontWeight:900,color:"var(--accent)",letterSpacing:-1 }}>${stats.ingresos.toFixed(0)}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>Ingresos</div></div>
          <div style={estilo}><div style={{ fontSize:26,fontWeight:900,color:"var(--teal)",letterSpacing:-1 }}>{stats.hoy}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>Hoy</div></div>
        </div>
        {load && <p style={{ textAlign:"center",color:"var(--muted)",padding:"32px 0" }}>Cargando...</p>}
        {!load && pedidos.length === 0 && <div style={{ textAlign:"center",padding:"48px 0" }}><div style={{ fontSize:40,marginBottom:10 }}>📊</div><p style={{ fontWeight:700 }}>Sin ventas aún</p></div>}
        {pedidos.map((p: any) => (
          <div key={p.id} style={{ background:"var(--card)",border:`1px solid ${p.estado==="entregado"?"var(--tealBorder)":"var(--border)"}`,borderRadius:16,padding:14,boxShadow:"var(--shadow-sm)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
              <div><div style={{ fontWeight:700,fontSize:13 }}>📍 {p.pasaje} {p.numero_casa}</div><div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{new Date(p.creado_en).toLocaleString("es-SV",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div></div>
              <div style={{ textAlign:"right" as const }}><div style={{ fontWeight:900,fontSize:15,color:"var(--teal)" }}>${p.total?.toFixed(2)}</div><div style={{ fontSize:10,color: p.estado==="entregado"?"var(--teal)":"var(--muted)",marginTop:2,fontWeight:700 }}>{p.estado}</div></div>
            </div>
            <div style={{ fontSize:12,color:"var(--text2)" }}>{p.detalle?.map((d: any)=>`${d.cantidad}× ${d.producto?.nombre}`).join(", ")}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}