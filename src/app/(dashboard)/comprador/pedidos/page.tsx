"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store";
const EST: Record<string,any> = {
  pendiente:{label:"Pendiente",v:"gray"}, confirmado:{label:"Confirmado",v:"teal"},
  en_camino:{label:"En camino",v:"teal"}, entregado:{label:"Entregado ✓",v:"teal"}, cancelado:{label:"Cancelado",v:"red"},
};
export default function PedidosPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: perfil }, { data: p }] = await Promise.all([
        supabase.from("usuarios").select("*").eq("id", user.id).single(),
        supabase.from("pedidos").select("*, tienda:tiendas(nombre,categoria_id), detalle:detalle_pedido(*, producto:productos(nombre))").eq("comprador_id", user.id).order("creado_en",{ascending:false}).limit(50),
      ]);
      if (perfil) setUsuario(perfil);
      setPedidos(p ?? []); setLoading(false);
      supabase.channel("pedidos-c").on("postgres_changes",{event:"UPDATE",schema:"public",table:"pedidos",filter:`comprador_id=eq.${user.id}`},(pl: any)=>{
        setPedidos(prev => prev.map((x: any) => x.id === pl.new.id ? {...x,...pl.new} : x));
      }).subscribe();
    });
  }, [setUsuario]);
  return (
    <PageShell title="Mis pedidos">
      <div style={{ padding:"16px" }}>
        {loading && <p style={{ textAlign:"center",color:"var(--muted)",padding:"40px 0" }}>Cargando...</p>}
        {!loading && pedidos.length === 0 && (
          <div style={{ textAlign:"center",padding:"60px 0" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📦</div>
            <p style={{ fontWeight:700 }}>Sin pedidos todavía</p>
          </div>
        )}
        {pedidos.map((p: any) => (
          <div key={p.id} style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:16,marginBottom:10,boxShadow:"var(--shadow-sm)",borderLeft:"4px solid var(--teal)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:900,fontSize:14 }}>{p.tienda?.nombre ?? "Tienda"}</div>
                <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{new Date(p.creado_en).toLocaleString("es-SV",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
              <Badge variant={EST[p.estado]?.v ?? "gray"}>{EST[p.estado]?.label ?? p.estado}</Badge>
            </div>
            <div style={{ fontSize:13,color:"var(--text2)",marginBottom:8 }}>
              {p.detalle?.map((d: any) => `${d.cantidad}x ${d.producto?.nombre}`).join(", ")}
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"var(--muted)" }}>📍 {p.pasaje} {p.numero_casa}</span>
              <span style={{ fontWeight:900,fontSize:15,color:"var(--teal)" }}>${p.total?.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}