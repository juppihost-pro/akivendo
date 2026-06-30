"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore, useTiendaStore } from "@/store";

export default function VendedorProductosPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [productos, setProductos] = useState<any[]>([]);
  const [tiendaId,  setTiendaId]  = useState<string | null>(null);
  const [form, setForm]   = useState({ nombre:"", descripcion:"", precio:"" });
  const [editId, setEditId] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const [{ data: u }, { data: t }] = await Promise.all([
        sb.from("usuarios").select("*").eq("id", user.id).single(),
        sb.from("tiendas").select("id").eq("vendedor_id", user.id).single(),
      ]);
      if (u) setUsuario(u);
      if (t) { setTiendaId(t.id); cargar(sb, t.id); }
    });
  }, [setUsuario]);

  async function cargar(sb: any, tid: string) {
    const { data } = await sb.from("productos").select("*").eq("tienda_id", tid).order("nombre");
    setProductos(data ?? []);
  }

  async function guardar() {
    if (!tiendaId || !form.nombre.trim() || !form.precio) return;
    setGuardando(true); setErrorMsg("");
    const sb = createClient();
    let imagen_url: string | undefined;
    if (imgFile) {
      const ext  = imgFile.name.split(".").pop();
      const path = `${tiendaId}_${Date.now()}.${ext}`;
      const { error: se } = await sb.storage.from("fotos-productos").upload(path, imgFile, { upsert: true });
      if (!se) { const { data: u } = sb.storage.from("fotos-productos").getPublicUrl(path); imagen_url = u.publicUrl; }
    }
    const payload: any = { nombre: form.nombre.trim(), descripcion: form.descripcion || null, precio: parseFloat(form.precio), tienda_id: tiendaId, activo: true };
    if (imagen_url) payload.imagen_url = imagen_url;
    let error;
    if (editId) ({ error } = await sb.from("productos").update(payload).eq("id", editId));
    else        ({ error } = await sb.from("productos").insert(payload));
    if (error) { setErrorMsg(error.message); setGuardando(false); return; }
    setForm({ nombre:"", descripcion:"", precio:"" }); setEditId(null); setImgFile(null);
    cargar(sb, tiendaId); setGuardando(false);
  }

  async function toggleActivo(p: any) {
    const sb = createClient();
    await sb.from("productos").update({ activo: !p.activo }).eq("id", p.id);
    if (tiendaId) cargar(sb, tiendaId);
  }

  async function eliminar(id: string) {
    if (!confirm("Borrar este producto?")) return;
    const sb = createClient();
    await sb.from("productos").delete().eq("id", id);
    if (tiendaId) cargar(sb, tiendaId);
  }

  const inp: React.CSSProperties = { width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--bg3)",fontFamily:"Montserrat,sans-serif",fontSize:14,color:"var(--text)",outline:"none" };
  const lbl: React.CSSProperties = { display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase" as const,color:"var(--muted)",marginBottom:5 };

  return (
    <PageShell title="Mis productos">
      <div style={{ padding:"16px",display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ background:"var(--card)",borderRadius:20,padding:18,border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)" }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>{editId?"Editar":"Agregar"} producto</div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div><label style={lbl}>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej. Pupusas de queso" style={inp}/></div>
            <div><label style={lbl}>Descripción (opcional)</label><input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción breve" style={inp}/></div>
            <div><label style={lbl}>Precio ($)</label><input type="number" min="0" step="0.25" value={form.precio} onChange={e=>setForm({...form,precio:e.target.value})} placeholder="0.00" style={inp}/></div>
            <div><label style={lbl}>Foto (opcional)</label><input type="file" accept="image/*" onChange={e=>setImgFile(e.target.files?.[0]??null)} style={{...inp,cursor:"pointer"}}/></div>
            {errorMsg && <div style={{ padding:"10px",borderRadius:10,fontSize:13,color:"#dc2626",background:"rgba(239,68,68,0.08)" }}>{errorMsg}</div>}
            <div style={{ display:"flex",gap:10 }}>
              {editId && <button onClick={()=>{setEditId(null);setForm({nombre:"",descripcion:"",precio:""});}} style={{ flex:1,padding:"12px",borderRadius:100,border:"1.5px solid var(--border)",background:"transparent",color:"var(--text)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancelar</button>}
              <button onClick={guardar} disabled={guardando||!form.nombre||!form.precio} style={{ flex:2,padding:"12px",borderRadius:100,border:"none",background:"var(--teal)",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:14,cursor:"pointer",opacity:guardando||!form.nombre||!form.precio?0.65:1,boxShadow:"0 4px 14px rgba(0,184,138,0.3)"}}>
                {guardando?"Guardando...":editId?"Guardar cambios":"+ Agregar"}
              </button>
            </div>
          </div>
        </div>
        {productos.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}><div style={{fontSize:36,marginBottom:8}}>📦</div><p style={{fontWeight:700}}>Sin productos aún</p><p style={{fontSize:13,marginTop:4}}>Agregá el primero arriba.</p></div>}
        {productos.map((p: any)=>(
          <div key={p.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:14,display:"flex",alignItems:"center",gap:14,boxShadow:"var(--shadow-sm)",opacity:p.activo?1:0.55}}>
            <div style={{width:52,height:52,borderRadius:12,background:"var(--bg3)",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
              {p.imagen_url?<img src={p.imagen_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"💧"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:14}}>{p.nombre}</div>
              {p.descripcion&&<div style={{fontSize:12,color:"var(--muted)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.descripcion}</div>}
              <div style={{fontWeight:900,fontSize:16,color:"var(--teal)",marginTop:4}}>${parseFloat(p.precio).toFixed(2)}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button onClick={()=>{setEditId(p.id);setForm({nombre:p.nombre,descripcion:p.descripcion??"",precio:p.precio?.toString()??""});window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"5px 12px",borderRadius:100,border:"1.5px solid var(--teal)",background:"transparent",color:"var(--teal)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>Editar</button>
              <button onClick={()=>toggleActivo(p)} style={{padding:"5px 12px",borderRadius:100,border:"1.5px solid var(--border)",background:"transparent",color:"var(--muted)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>{p.activo?"Pausar":"Activar"}</button>
              <button onClick={()=>eliminar(p.id)} style={{padding:"5px 12px",borderRadius:100,border:"1.5px solid rgba(239,68,68,0.4)",background:"transparent",color:"#dc2626",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:11,cursor:"pointer"}}>Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}