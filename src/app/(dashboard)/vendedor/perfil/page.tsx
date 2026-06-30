"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore, useTiendaStore } from "@/store";
import { useEmitirUbicacion } from "@/lib/hooks/useUbicacion";
import { CATEGORIAS_VENDEDOR } from "@/lib/constants";
import dynamic from "next/dynamic";
const MiniMapa = dynamic(() => import("@/components/mapa/MiniMapa"), { ssr:false, loading:()=><div style={{ height:180,background:"var(--bg3)",borderRadius:16 }} /> });

export default function VendedorPerfilPage() {
  const setUsuario    = useAuthStore(s => s.setUsuario);
  const tiendaActiva  = useTiendaStore(s => s.tiendaActiva);
  const setTienda     = useTiendaStore(s => s.setTiendaActiva);

  const [usuario,  setUsuarioL]  = useState<any>(null);
  const [tienda,   setTiendaL]   = useState<any>(null);
  const [formT,    setFormT]      = useState({ nombre:"",descripcion:"",categoria_id:"ambulante",horario:"",whatsapp:"",es_ambulante:true });
  const [editando, setEditando]   = useState(false);
  const [loading,  setLoading]    = useState(true);
  const [guardando,setGuardando]  = useState(false);
  const [imgFile,  setImgFile]    = useState<File | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");

  useEmitirUbicacion();

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: u }, { data: t }] = await Promise.all([
        sb.from("usuarios").select("*").eq("id", user.id).single(),
        sb.from("tiendas").select("*, categoria:categorias_vendedor(*)").eq("vendedor_id", user.id).single(),
      ]);
      if (u) { setUsuarioL(u); setUsuario(u); }
      if (t) { setTiendaL(t); setTienda(t); setFormT({ nombre:t.nombre,descripcion:t.descripcion???"",categoria_id:t.categoria_id,horario:t.horario???"",whatsapp:t.whatsapp,es_ambulante:t.es_ambulante }); }
      else setEditando(true);
      setLoading(false);
    });
  }, [setUsuario, setTienda]);

  async function guardar() {
    setGuardando(true); setErrorMsg("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    let logo_url = tiendaL?.logo_url;
    if (imgFile) {
      const ext = imgFile.name.split(".").pop();
      const path = `${user.id}_${Date.now()}.${ext}`;
      const { error: se } = await sb.storage.from("logos-tiendas").upload(path, imgFile, { upsert:true });
      if (!se) { const { data: u } = sb.storage.from("logos-tiendas").getPublicUrl(path); logo_url = u.publicUrl; }
    }
    const payload = { ...formT, vendedor_id:user.id, activa:true, logo_url };
    if (tiendaL) {
      const { error } = await sb.from("tiendas").update(payload).eq("id", tiendaL.id);
      if (error) { setErrorMsg(error.message); setGuardando(false); return; }
    } else {
      const { data, error } = await sb.from("tiendas").insert(payload).select("*, categoria:categorias_vendedor(*)").single();
      if (error) { setErrorMsg(error.message); setGuardando(false); return; }
      if (data) { setTiendaL(data); setTienda(data); }
    }
    setEditando(false); setGuardando(false);
    const { data: t } = await sb.from("tiendas").select("*, categoria:categorias_vendedor(*)").eq("vendedor_id", user.id).single();
    if (t) { setTiendaL(t); setTienda(t); }
  }

  async function toggleActiva() {
    if (!tiendaL) return;
    const sb = createClient();
    await sb.from("tiendas").update({ activa: !tiendaL.activa }).eq("id", tiendaL.id);
    setTiendaL({ ...tiendaL, activa: !tiendaL.activa });
    setTienda({ ...tiendaL, activa: !tiendaL.activa });
  }

  const inp: React.CSSProperties = { width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--bg3)",fontFamily:"Montserrat,sans-serif",fontSize:14,color:"var(--text)",outline:"none" };
  const lbl: React.CSSProperties = { display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:5 };

  if (loading) return <PageShell title="Mi tienda"><p style={{ textAlign:"center",padding:"60px 0",color:"var(--muted)" }}>Cargando...</p></PageShell>;

  return (
    <PageShell title="Mi tienda">
      <div style={{ padding:"16px",display:"flex",flexDirection:"column",gap:14 }}>

        {/* Estado GPS si es ambulante */}
        {tiendaL?.activa && tiendaL?.es_ambulante && (
          <div style={{ background:"var(--tealBg)",border:"1px solid var(--tealBorder)",borderRadius:16,padding:"12px 16px",display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ width:10,height:10,borderRadius:"50%",background:"var(--teal)",boxShadow:"0 0 8px var(--teal)",flexShrink:0 }} />
            <div>
              <div style={{ fontWeight:800,fontSize:14,color:"var(--teal)" }}>Ubicación activa 🟢</div>
              <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>Tu posición se comparte cada 8s con los compradores cercanos.</div>
            </div>
          </div>
        )}

        {/* Tarjeta tienda */}
        {tiendaL && !editando && (
          <div style={{ background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:20,boxShadow:"var(--shadow-sm)" }}>
            <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:14 }}>
              <div style={{ width:60,height:60,borderRadius:16,background:"var(--bg3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:"1px solid var(--border)",overflow:"hidden",flexShrink:0 }}>
                {tiendaL.logo_url ? <img src={tiendaL.logo_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} /> : CATEGORIAS_VENDEDOR.find(c=>c.id===tiendaL.categoria_id)?.emoji ?? "🏪"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900,fontSize:16,letterSpacing:-0.3 }}>{tiendaL.nombre}</div>
                <div style={{ fontSize:12,color:"var(--muted)",marginTop:3 }}>
                  {CATEGORIAS_VENDEDOR.find(c=>c.id===tiendaL.categoria_id)?.nombre}
                  {tiendaL.es_ambulante ? " · Ambulante 🚶" : ""}
                </div>
                {tiendaL.horario && <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>🕐 {tiendaL.horario}</div>}
                <div style={{ fontSize:12,color:"var(--teal)",marginTop:2 }}>💬 WhatsApp: {tiendaL.whatsapp}</div>
              </div>
            </div>
            {tiendaL.descripcion && <p style={{ fontSize:13,color:"var(--text2)",lineHeight:1.6,marginBottom:14 }}>{tiendaL.descripcion}</p>}
            {tiendaL.lat_actual && tiendaL.lng_actual && (
              <div style={{ height:160,borderRadius:14,overflow:"hidden",marginBottom:14 }}>
                <MiniMapa lat={tiendaL.lat_actual} lng={tiendaL.lng_actual} label={tiendaL.nombre} />
              </div>
            )}
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => setEditando(true)} style={{ flex:1,padding:"12px",borderRadius:100,border:"1.5px solid var(--border)",background:"transparent",color:"var(--text)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer" }}>✏️ Editar</button>
              <button onClick={toggleActiva} style={{ flex:1,padding:"12px",borderRadius:100,border:"none",background:tiendaL.activa?"rgba(239,68,68,0.1)":"var(--teal)",color:tiendaL.activa?"#dc2626":"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:13,cursor:"pointer",border:tiendaL.activa?"1.5px solid rgba(239,68,68,0.3)":"none" }}>
                {tiendaL.activa ? "⏸ Pausar" : "▶ Activar"}
              </button>
            </div>
          </div>
        )}

        {/* Formulario crear/editar */}
        {editando && (
          <div style={{ background:"var(--card)",borderRadius:20,padding:20,border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)",display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ fontWeight:900,fontSize:16 }}>{tiendaL ? "Editar tienda" : "Configurar mi tienda"}</div>
            <div><label style={lbl}>Nombre del negocio</label><input value={formT.nombre} onChange={e=>setFormT({...formT,nombre:e.target.value})} placeholder="Ej. Tienda Don José" style={inp} /></div>
            <div><label style={lbl}>Categoría</label>
              <select value={formT.categoria_id} onChange={e=>setFormT({...formT,categoria_id:e.target.value})} style={inp}>
                {CATEGORIAS_VENDEDOR.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Descripción (opcional)</label><textarea value={formT.descripcion} onChange={e=>setFormT({...formT,descripcion:e.target.value})} placeholder="¿Qué vendés?" style={{ ...inp,height:72,resize:"none" }} /></div>
            <div><label style={lbl}>Horario (opcional)</label><input value={formT.horario} onChange={e=>setFormT({...formT,horario:e.target.value})} placeholder="Ej. Lunes a viernes 8am-5pm" style={inp} /></div>
            <div><label style={lbl}>WhatsApp (sin código país)</label>
              <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--bg3)",borderRadius:12,border:"1px solid var(--border)",padding:"0 12px" }}>
                <span style={{ fontSize:13,fontWeight:600,color:"var(--muted)" }}>+503</span>
                <input type="tel" value={formT.whatsapp} onChange={e=>setFormT({...formT,whatsapp:e.target.value})} placeholder="7000 0000" style={{ ...inp,border:"none",background:"transparent",padding:"12px 0" }} />
              </div>
              <p style={{ fontSize:11,color:"var(--muted)",marginTop:4 }}>Los pedidos llegarán a este número de WhatsApp.</p>
            </div>
            <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
              <input type="checkbox" checked={formT.es_ambulante} onChange={e=>setFormT({...formT,es_ambulante:e.target.checked})} style={{ width:18,height:18,accentColor:"var(--teal)" }} />
              <span style={{ fontSize:14,fontWeight:600 }}>Soy vendedor ambulante (comparto ubicación GPS)</span>
            </label>
            <div><label style={lbl}>Logo (opcional)</label><input type="file" accept="image/*" onChange={e=>setImgFile(e.target.files?.[0]??null)} style={{ ...inp,cursor:"pointer" }} /></div>
            {errorMsg && <div style={{ padding:"10px 14px",borderRadius:12,fontSize:13,color:"#dc2626",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)" }}>{errorMsg}</div>}
            <div style={{ display:"flex",gap:10 }}>
              {tiendaL && <button onClick={()=>setEditando(false)} style={{ flex:1,padding:"13px",borderRadius:100,border:"1.5px solid var(--border)",background:"transparent",color:"var(--text)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer" }}>Cancelar</button>}
              <button onClick={guardar} disabled={guardando||!formT.nombre||!formT.whatsapp} style={{ flex:2,padding:"13px",borderRadius:100,border:"none",background:"var(--teal)",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,184,138,0.3)",opacity:guardando||!formT.nombre||!formT.whatsapp?0.65:1 }}>
                {guardando?"Guardando...":"Guardar tienda ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}