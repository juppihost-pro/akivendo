"use client";
import { useEffect, useRef } from "react";
import { TILE_URL, TILE_ATTRIBUTION } from "@/lib/constants";
interface Props { lat: number; lng: number; label?: string; zoom?: number; }
export default function MiniMapa({ lat, lng, label, zoom=17 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: any;
    import("leaflet").then((L: any) => {
      if (!ref.current) return;
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png" });
      map = L.map(ref.current, { center:[lat,lng], zoom, zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:false });
      L.tileLayer(TILE_URL, { attribution:TILE_ATTRIBUTION }).addTo(map);
      const icon = L.divIcon({ html:`<div style="background:var(--teal);border:3px solid #fff;border-radius:50%;width:20px;height:20px;box-shadow:0 3px 8px rgba(0,0,0,0.3)"></div>`, iconSize:[20,20], iconAnchor:[10,10], className:"" });
      L.marker([lat,lng], { icon }).addTo(map);
    });
    return () => { map?.remove(); };
  }, [lat, lng, zoom]);
  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div ref={ref} style={{ width:"100%",height:"100%" }} />
    </>
  );
}
