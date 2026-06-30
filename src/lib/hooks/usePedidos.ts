"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTiendaStore } from "@/store";
import { CHANNEL_PEDIDOS } from "@/lib/constants";

export function useEscucharPedidos() {
  const tiendaActiva = useTiendaStore(s => s.tiendaActiva);
  const setPedidos   = useTiendaStore(s => s.setPedidos);
  const marcar       = useTiendaStore(s => s.marcarEntregado);

  useEffect(() => {
    if (!tiendaActiva?.id) return;
    const supabase = createClient();
    supabase.from("pedidos")
      .select("*, comprador:usuarios(nombre,email), detalle:detalle_pedido(*, producto:productos(nombre,precio))")
      .eq("tienda_id", tiendaActiva.id).in("estado", ["pendiente","confirmado","en_camino"])
      .order("creado_en", { ascending: true })
      .then(({ data }) => { if (data) setPedidos(data as any); });

    const ch = supabase.channel(`${CHANNEL_PEDIDOS}-${tiendaActiva.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"pedidos", filter:`tienda_id=eq.${tiendaActiva.id}` }, (payload) => {
        if (payload.eventType === "INSERT") setPedidos([...useTiendaStore.getState().pedidosPendientes, payload.new as any]);
        if (payload.eventType === "UPDATE") {
          const u = payload.new as any;
          if (u.estado === "entregado" || u.estado === "cancelado") marcar(u.id);
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tiendaActiva?.id, setPedidos, marcar]);
}
