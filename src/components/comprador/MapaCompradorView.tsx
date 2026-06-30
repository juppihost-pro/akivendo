"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMapaStore, useAuthStore } from "@/store";
import { useSuscribirUbicaciones } from "@/lib/hooks/useUbicacion";
import { distanciaMetros, formatDistancia } from "@/lib/utils";
import { CATEGORIAS_VENDEDOR } from "@/lib/constants";
import { NavBar } from "@/components/ui/NavBar";
import { Badge } from "@/components/ui/Badge";
import ModalPedido from "@/components/pedidos/ModalPedido";
import type { Usuario, Tienda } from "@/lib/types";

const MapaLeaflet = dynamic(() => import("@/components/mapa/MapaLeaflet"), {
  ssr: false,
  loading: () => <div style={{ width:"100%",height:"100%",background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontSize:13,color:"var(--muted)" }}>Cargando mapa...</span></div>,
});

type TiendaEx = Tienda & { distancia_metros?: number; categoria?: any; vendedor?: any };

export default function MapaCompradorView({ usuario }: { usuario: Usuario }) {
  const supabase = createClient();
  const setUbicacion   = useMapaStore(s => s.setUbicacion);
  const ubicacion      = useMapaStore(s => s.ubicacionUsuario);
  const setTiendas     = useMapaStore(s => s.setTiendasCercanas);
  const tiendas        = useMapaStore(s => s.tiendasCercanas) as TiendaEx[];
  const catActiva      = useMapaStore(s => s.categoriaActiva);
  const setCatActiva   = useMapaStore(s => s.setCategoriaActiva);
  const setUsuario     = useAuthStore(s => s.setUsuario);

  useEffect(() => { setUsuario(usuario); }, [usuario, setUsuario]);

  const [cargando,  setCargando]  = useState(true);
  const [seleccion, setSeleccion] = useState<TiendaEx | null>(null);

  useSuscribirUbicaciones();

  // GPS
  useEffect(() => {
    navigator.geolocation.watchPosition(
      ({ coords }) => setUbicacion({ lat: coords.latitude, lng: coords.longitude }),
      () => {}, { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }, [setUbicacion]);

  // Cargar tiendas activas
  const cargarTiendas = useCallback(async () => {
    const { data } = await supabase
      .from("tiendas")
      .select("*, vendedor:usuarios(nombre,email), categoria:categorias_vendedor(id,nombre,emoji)")
      .eq("activa", true)
      .order("ultima_ubicacion", { ascending: false });
    if (!data) { setCargando(false); return; }
    const conDist = data.map((t: any) => ({
      ...t,
      distancia_metros: ubicacion && t.lat_actual && t.lng_actual
        ? Math.round(distanciaMetros(ubicacion.lat, ubicacion.lng, t.lat_actual, t.lng_actual))
        : undefined,
    })).sort((a: any, b: any) => (a.distancia_metros ?? 99999) - (b.distancia_metros ?? 99999));
    setTiendas(conDist);
    setCargando(false);
  }, [ubicacion?.lat, ubicacion?.lng]);

  useEffect(() => { cargarTiendas(); }, [cargarTiendas]);

  // Filtrar por categoría
  const tiiendasFiltradas = catActiva === "todos"
    ? tiendas
    : tiendas.filter(t => t.categoria_id === catActiva);

  const TABS = [
    { id: "todos", emoji: "🌎", label: "Todos" },
    ...CATEGORIAS_VENDEDOR,
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"var(--bg)", overflow:"hidden" }}>

      {/* ── MAPA — 40% altura ─────────────────────────────────────────────── */}
      <div style={{ height:"40vh", position:"relative", flexShrink:0 }}>
        <MapaLeaflet
          ubicacion={ubicacion}
          tiendas={tiendas.filter(t => t.lat_actual && t.lng_actual)}
          onClickTienda={t => setSeleccion(t as TiendaEx)}
        />
        {/* Logo flotante */}
        <div style={{ position:"absolute", top:12, left:12, zIndex:999,
          background:"var(--card)", borderRadius:12, padding:"6px 12px",
          border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)",
          fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:16, letterSpacing:-0.5 }}>
          aki<span style={{ color:"var(--accent)" }}>vendo</span>
        </div>
        {!ubicacion && (
          <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)",
            zIndex:999, background:"var(--card)", borderRadius:100, padding:"7px 16px",
            border:"1px solid var(--border)", fontSize:12, fontWeight:600, color:"var(--muted)",
            boxShadow:"var(--shadow-sm)", whiteSpace:"nowrap" }}>
            📍 Obteniendo ubicación...
          </div>
        )}
      </div>

      {/* ── PANEL INFERIOR — 60% ──────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden",
        background:"var(--bg)", borderRadius:"20px 20px 0 0",
        marginTop:-16, position:"relative", zIndex:10,
        boxShadow:"0 -4px 20px rgba(0,0,0,0.08)" }}>

        {/* Drag handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:10, paddingBottom:4 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"var(--border)" }} />
        </div>

        {/* Header con puntos */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"4px 16px 8px" }}>
          <div>
            <span style={{ fontWeight:900, fontSize:15, letterSpacing:-0.4 }}>
              Vendedores activos
            </span>
            {!cargando && (
              <span style={{ fontSize:12, color:"var(--muted)", marginLeft:6 }}>
                · {tiiendasFiltradas.length} disponibles
              </span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6,
            background:"var(--tealBg)", border:"1px solid var(--tealBorder)",
            borderRadius:100, padding:"5px 12px", fontSize:12, fontWeight:700, color:"var(--teal)" }}>
            ⭐ {usuario.puntos_acumulados} pts
          </div>
        </div>

        {/* ── TABS DE CATEGORÍAS ─────────────────────────────────────────── */}
        <div style={{ overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
          <div style={{ display:"flex", gap:8, padding:"0 16px", minWidth:"max-content" }}>
            {TABS.map(tab => {
              const activo = catActiva === tab.id;
              return (
                <button key={tab.id} onClick={() => setCatActiva(tab.id)}
                  style={{ display:"flex", alignItems:"center", gap:6,
                    padding:"8px 14px", borderRadius:100, border:"none",
                    fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:12,
                    cursor:"pointer", transition:"all .2s", whiteSpace:"nowrap",
                    background: activo ? "var(--teal)" : "var(--card)",
                    color: activo ? "#fff" : "var(--text2)",
                    boxShadow: activo ? "0 3px 10px rgba(0,184,138,0.3)" : "var(--shadow-sm)",
                    border: activo ? "none" : "1px solid var(--border)" }}>
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LISTA DE TIENDAS ───────────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:"auto", padding:"10px 16px 80px" }}>
          {cargando && (
            <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)", fontSize:14 }}>
              Buscando vendedores...
            </div>
          )}

          {!cargando && tiiendasFiltradas.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🏪</div>
              <p style={{ fontWeight:800, fontSize:15 }}>Sin vendedores activos</p>
              <p style={{ fontSize:13, color:"var(--muted)", marginTop:4, lineHeight:1.6 }}>
                No hay vendedores en esta categoría<br/>en este momento.
              </p>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {tiiendasFiltradas.map(t => {
              const cat = CATEGORIAS_VENDEDOR.find(c => c.id === t.categoria_id);
              return (
                <div key={t.id} onClick={() => setSeleccion(t)}
                  style={{ background:"var(--card)", border:"1px solid var(--border)",
                    borderRadius:18, padding:"14px 16px", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:14,
                    boxShadow:"var(--shadow-sm)", transition:"all .2s",
                    borderLeft:`4px solid var(--teal)` }}
                  onMouseEnter={e => { (e.currentTarget as any).style.transform="translateY(-2px)"; (e.currentTarget as any).style.boxShadow="var(--shadow)"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.transform="translateY(0)"; (e.currentTarget as any).style.boxShadow="var(--shadow-sm)"; }}>

                  {/* Logo / emoji */}
                  <div style={{ width:50, height:50, borderRadius:14, flexShrink:0, overflow:"hidden",
                    background:"var(--bg3)", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:26, border:"1px solid var(--border)" }}>
                    {t.logo_url
                      ? <img src={t.logo_url} alt={t.nombre} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                      : cat?.emoji ?? "🏪"}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:900, fontSize:14, letterSpacing:-0.3, marginBottom:2 }}>
                      {t.nombre}
                    </div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>
                      {cat?.emoji} {cat?.nombre ?? "Vendedor"}
                      {t.horario ? ` · ${t.horario}` : ""}
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {t.es_ambulante && (
                        <Badge variant="teal">🚶 Ambulante</Badge>
                      )}
                      {t.distancia_metros !== undefined
                        ? <Badge variant={t.distancia_metros < 500 ? "teal" : "gray"}>
                            📍 {formatDistancia(t.distancia_metros)}
                          </Badge>
                        : <Badge variant="gray">📍 En línea</Badge>
                      }
                    </div>
                  </div>

                  <div style={{ flexShrink:0 }}>
                    <button onClick={e => { e.stopPropagation(); setSeleccion(t); }}
                      style={{ background:"var(--teal)", color:"#fff", border:"none",
                        borderRadius:100, padding:"9px 16px", fontWeight:800,
                        fontSize:12, fontFamily:"Montserrat,sans-serif", cursor:"pointer",
                        boxShadow:"0 3px 10px rgba(0,184,138,0.3)" }}>
                      Ver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NavBar />

      {seleccion && (
        <ModalPedido tienda={seleccion} onClose={() => setSeleccion(null)} />
      )}
    </div>
  );
}
