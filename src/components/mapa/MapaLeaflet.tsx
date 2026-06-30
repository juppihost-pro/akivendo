"use client";
import { useEffect, useRef } from "react";
import { TILE_URL, TILE_ATTRIBUTION, MAPA_DEFAULT, CATEGORIAS_VENDEDOR } from "@/lib/constants";
import type { Tienda } from "@/lib/types";

interface Props {
  ubicacion: { lat: number; lng: number } | null;
  tiendas: (Tienda & { distancia_metros?: number })[];
  onClickTienda?: (t: Tienda) => void;
}

export default function MapaLeaflet({ ubicacion, tiendas, onClickTienda }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMk  = useRef<any>(null);

  useEffect(() => {
    import("leaflet").then((L: any) => {
      if (!mapRef.current || mapInst.current) return;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const center = ubicacion ? [ubicacion.lat, ubicacion.lng] : [MAPA_DEFAULT.lat, MAPA_DEFAULT.lng];
      mapInst.current = L.map(mapRef.current, { center, zoom: MAPA_DEFAULT.zoom, zoomControl: false });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(mapInst.current);
      L.control.zoom({ position:"bottomright" }).addTo(mapInst.current);
    });
    return () => { mapInst.current?.remove(); mapInst.current = null; };
  }, []);

  // Marcador usuario
  useEffect(() => {
    if (!ubicacion || !mapInst.current) return;
    import("leaflet").then((L: any) => {
      const icon = L.divIcon({ html:`<div style="width:14px;height:14px;background:var(--lime,#5ec400);border-radius:50%;border:3px solid #fff;box-shadow:0 0 10px rgba(94,196,0,0.6)"></div>`, iconSize:[14,14], iconAnchor:[7,7], className:"" });
      if (userMk.current) userMk.current.setLatLng([ubicacion.lat, ubicacion.lng]);
      else { userMk.current = L.marker([ubicacion.lat, ubicacion.lng], { icon }).addTo(mapInst.current).bindPopup("<b>Tu ubicación</b>"); mapInst.current.setView([ubicacion.lat, ubicacion.lng], MAPA_DEFAULT.zoom); }
    });
  }, [ubicacion?.lat, ubicacion?.lng]);

  // Marcadores tiendas
  useEffect(() => {
    import("leaflet").then((L: any) => {
      if (!mapInst.current) return;
      markers.current.forEach(m => m.remove());
      markers.current = [];
      tiendas.forEach(t => {
        if (!t.lat_actual || !t.lng_actual) return;
        const cat = CATEGORIAS_VENDEDOR.find(c => c.id === t.categoria_id);
        const emoji = cat?.emoji ?? "🏪";
        const icon = L.divIcon({ html:`<div style="background:var(--card);border:2px solid var(--teal);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.2);cursor:pointer">${emoji}</div>`, iconSize:[36,36], iconAnchor:[18,18], className:"" });
        const mk = L.marker([t.lat_actual, t.lng_actual], { icon }).addTo(mapInst.current).bindPopup(`<b>${t.nombre}</b><br>${cat?.nombre ?? ""}`);
        if (onClickTienda) mk.on("click", () => onClickTienda(t));
        markers.current.push(mk);
      });
    });
  }, [tiendas, onClickTienda]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div ref={mapRef} style={{ width:"100%", height:"100%" }} />
    </>
  );
}
