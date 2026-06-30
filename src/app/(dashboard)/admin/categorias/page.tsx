"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/ui/PageShell";
import { useAuthStore } from "@/store";
export default function AdminCategoriasPage() {
  const setUsuario = useAuthStore(s => s.setUsuario);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState({ nombre:"",emoji:"🏪",descripcion:"" });
  const [edit, setEdit] = useState<any>(null);
  const [load, setLoad] = useState(true);
  const sb = createClient();
  async function cargar() {
    const { data } = await sb.from("categorias_vendedor").select("*").order("nombre");
    setCats(data??[]); setLoad(false);
  }
  useEffect(()=>{ sb.auth.getUser().then(async({data:{user}})=>{ if(!user) return; const {data:u}=await sb.from("usuarios").select("*").eq("id",user.id).single(); if(u) setUsuario(u); cargar(); }); },[]);
  async function guardar() {
    if (!form.nombre.trim()) return;
    if (edit) { await sb.from("categorias_vendedor").update(form).eq("id",edit.id); setEdit(null); }
    else { await sb.from("categorias_vendedor").insert(form); }
    setForm({nombre:"",emoji:"🏪",descripcion:""}); cargar();
  }
  async function eliminar(id: string) { if(!confirm("¿Eliminar?")) return; await sb.from("categorias_vendedor").delete().eq("id",id); cargar(); }
  const inp: React.CSSProperties = {width:"100%",padding:"11px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--bg3)",fontFamily:"Montserrat,sans-serif",fontSize:14,color:"var(--text)",outline:"none"};
  return (
    <PageShell title="Categorías de vendedores">
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"var(--card)",borderRadius:18,padding:18,border:"1px solid var(--border)"}}>
          <div style={{fontWeight:800,fontSize:14,marginBottom:12}}>{edit?"Editar":"Nueva"} categoría</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:10}}>
              <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>Emoji</label><input value={form.emoji} onChange={e=>setForm({...form,emoji:e.target.value})} style={{...inp,textAlign:"center",fontSize:22}} /></div>
              <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej. Zapatería" style={inp} /></div>
            </div>
            <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>Descripción (opcional)</label><input value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Breve descripción" style={inp} /></div>
            <div style={{display:"flex",gap:10}}>
              {edit && <button onClick={()=>{setEdit(null);setForm({nombre:"",emoji:"🏪",descripcion:""}); }} style={{flex:1,padding:"11px",borderRadius:100,border:"1.5px solid var(--border)",background:"transparent",color:"var(--text)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>Cancelar</button>}
              <button onClick={guardar} disabled={!form.nombre.trim()} style={{flex:2,padding:"11px",borderRadius:100,border:"none",background:"var(--teal)",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:13,cursor:"pointer"}}>{edit?"Guardar cambios":"Crear categoría"}</button>
            </div>
          </div>
        </div>
        {cats.map(c=>(
          <div key={c.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,boxShadow:"var(--shadow-sm)"}}>
            <span style={{fontSize:28}}>{c.emoji}</span>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{c.nombre}</div>{c.descripcion&&<div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{c.descripcion}</div>}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setEdit(c);setForm({nombre:c.nombre,emoji:c.emoji,descripcion:c.descripcion??""});}} style={{padding:"6px 14px",borderRadius:100,border:"1.5px solid var(--teal)",background:"transparent",color:"var(--teal)",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>Editar</button>
              <button onClick={()=>eliminar(c.id)} style={{padding:"6px 14px",borderRadius:100,border:"1.5px solid #dc2626",background:"transparent",color:"#dc2626",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"}}>×</button>
            </div>
          </div>
        ))}
        {!load&&cats.length===0&&<p style={{textAlign:"center",color:"var(--muted)",padding:"24px 0"}}>Sin categorías. Creá la primera arriba.</p>}
      </div>
    </PageShell>
  );
}