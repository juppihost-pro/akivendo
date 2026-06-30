"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, useTiendaStore } from "@/store";
import { useEscucharPedidos } from "@/lib/hooks/usePedidos";
import { abrirWhatsApp } from "@/lib/utils";
import dynamic from "next/dynamic";
const MiniMapa = dynamic(() => import("@/components/mapa/MiniMapa"), { ssr:false, loading:()=><div style={{ height:160,background:"var(--bg3)",borderRadius:12 }} /> });

export default function VendedorPedidosPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const setTienda  = useTiendaStore(s => s.setTiendaActiva);
  const pedidos    = useTiendaStore(s => s.pedidosPendientes);
  const marcar     = useTiendaStore(s => s.marcarEntregado);
  const [expandido, setExpandido] = useState<string|null>(null);

  useEscucharPedidos();

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: u }, { data: t }] = await Promise.all([
        sb.from("usuarios").select("*").eq("id", user.id).single(),
        sb.from("tiendas").select("*").eq("vendedor_id", user.id).eq("activa", true).single(),
      ]);
      if (u) { setUsuario(u); }
      if (t) setTienda(t);
    });
  }, [setUsuario, setTienda]);

  async function marcarEntregado(pedidoId: string) {
    const sb = createClient();
    const { error } = await sb.from("pedidos").update({ estado:"entregado",actualizado_en:new Date().toISOString() }).eq("id", pedidoId);
    if (error) { alert("Error: " + error.message); return; }
    marcar(pedidoId);
  }

  const pendientes = pedidos.filter((p: any) => p.estado !== "entregado");
  const entregados = pedidos.filter((p: any) => p.estado === "entregado");

  return (
    <PageShell title="Pedidos">
      <div style={{ padding:"16px" }}>
        {pendientes.length === 0 && (
          <div style={{ textAlign:"center",padding:"48px 0" }}>
            <div style={{ fontSize:48,marginBottom:10 }}>📋</div>
            <p style={{ fontWeight:800,fontSize:15 }}>Sin pedidos por ahora</p>
            <p style={{ fontSize:13,color:"var(--muted)",marginTop:4,lineHeight:1.6 }}>Cuando un comprador haga un pedido, aparece aquí y en tu WhatsApp.</p>
          </div>
        )}

        {pendientes.map((p: any) => (
          <div key={p.id} style={{ background:"var(--card)",border:"1.5px solid var(--teal)",borderRadius:18,padding:16,marginBottom:12,boxShadow:"var(--shadow-sm)" }}>
            <div onClick={()=>setExpandido(expandido===p.id?null:p.id)} style={{ cursor:"pointer" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:900,fontSize:15 }}>📍 {p.pasaje} · {p.numero_casa}</div>
                  <div style={{ fontSize:12,color:"var(--muted)",marginTop:3 }}>{p.comprador?.nombre ?? "Comprador"}</div>
                </div>
                <span style={{ fontWeight:900,fontSize:16,color:"var(--teal)" }}>${p.total?.toFixed(2)}</span>
              </div>
              <div style={{ fontSize:13,color:"var(--text2)",marginBottom:10,lineHeight:1.5 }}>
                {p.detalle?.map((d: any) => `${d.cantidad}× ${d.producto?.nombre}`).join(" · ")}
              </div>
              {p.notas && <div style={{ fontSize:12,color:"var(--muted)",fontStyle:"italic",marginBottom:10 }}>📝 {p.notas}</div>}
            </div>

            {/* Mapa expandible */}
            {expandido === p.id && p.lat_entrega && p.lng_entrega && (
              <div style={{ borderRadius:14,overflow:"hidden",height:180,marginBottom:12 }}>
                <MiniMapa lat={p.lat_entrega} lng={p.lng_entrega} label={`${p.pasaje} ${p.numero_casa}`} zoom={17} />
              </div>
            )}

            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>abrirWhatsApp(p.tienda?.whatsapp??"",p)} style={{ flex:1,padding:"10px",borderRadius:100,border:"1.5px solid rgba(37,211,102,0.4)",background:"rgba(37,211,102,0.08)",color:"#128c7e",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer" }}>
                💬 WhatsApp
              </button>
              <button onClick={()=>marcarEntregado(p.id)} style={{ flex:2,padding:"10px",borderRadius:100,border:"none",background:"var(--teal)",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:13,cursor:"pointer",boxShadow:"0 3px 10px rgba(0,184,138,0.3)" }}>
                ✓ Entregado
              </button>
            </div>
          </div>
        ))}

        {entregados.length > 0 && (
          <>
            <div style={{ fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--teal)",margin:"16px 0 8px" }}>Entregados ({entregados.length})</div>
            {entregados.map((p: any) => (
              <div key={p.id} style={{ background:"var(--bg3)",border:"1px solid var(--tealBorder)",borderRadius:16,padding:14,marginBottom:8,opacity:0.7 }}>
                <div style={{ display:"flex",justifyContent:"space-between" }}>
                  <div><div style={{ fontWeight:700,fontSize:13 }}>✓ {p.pasaje} · {p.numero_casa}</div><div style={{ fontSize:12,color:"var(--muted)" }}>{p.detalle?.map((d: any)=>`${d.cantidad}× ${d.producto?.nombre}`).join(", ")}</div></div>
                  <span style={{ fontWeight:800,fontSize:14,color:"var(--teal)" }}>${p.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </PageShell>
  );
}