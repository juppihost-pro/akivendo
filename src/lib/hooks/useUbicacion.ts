"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMapaStore, useTiendaStore } from "@/store";
import { INTERVALO_UBICACION_MS, CHANNEL_UBICACIONES } from "@/lib/constants";

export function useSuscribirUbicaciones() {
  const setTiendas = useMapaStore(s => s.setTiendasCercanas);
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(CHANNEL_UBICACIONES)
      .on("broadcast", { event: "ubicacion" }, ({ payload }) => {
        const actuales = useMapaStore.getState().tiendasCercanas;
        setTiendas(actuales.map((t: any) =>
          t.id === payload.tienda_id ? { ...t, lat_actual: payload.lat, lng_actual: payload.lng } : t
        ));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [setTiendas]);
}

export function useEmitirUbicacion() {
  const tiendaActiva = useTiendaStore(s => s.tiendaActiva);
  const intervalRef  = useRef<any>(null);
  useEffect(() => {
    if (!tiendaActiva?.activa) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    const supabase = createClient();
    const ch = supabase.channel(CHANNEL_UBICACIONES);
    ch.subscribe(status => {
      if (status !== "SUBSCRIBED") return;
      const emitir = () => {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          ch.send({ type:"broadcast", event:"ubicacion", payload:{ tienda_id:tiendaActiva.id, lat:coords.latitude, lng:coords.longitude, ts:new Date().toISOString() } });
          supabase.from("tiendas").update({ lat_actual:coords.latitude, lng_actual:coords.longitude, ultima_ubicacion:new Date().toISOString() }).eq("id", tiendaActiva.id).then(()=>{});
        }, err => console.warn("GPS:", err.message), { enableHighAccuracy:true, timeout:10000 });
      };
      emitir();
      intervalRef.current = setInterval(emitir, INTERVALO_UBICACION_MS);
    });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); supabase.removeChannel(ch); };
  }, [tiendaActiva?.id, tiendaActiva?.activa]);
}
