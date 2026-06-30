"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function ResetPage() {
  const router = useRouter();
  const [pw, setPw]   = useState("");
  const [c,  setC]    = useState("");
  const [ok, setOk]   = useState(false);
  const [err,setErr]  = useState("");
  const [load,setLoad]= useState(false);
  async function handle() {
    if (pw !== c)    { setErr("Las contraseñas no coinciden."); return; }
    if (pw.length<6) { setErr("Mínimo 6 caracteres."); return; }
    setLoad(true); setErr("");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setLoad(false); return; }
    setOk(true); setTimeout(() => router.push("/login"), 2500);
  }
  const inp: React.CSSProperties = { width:"100%",padding:"13px 16px",borderRadius:12,border:"1px solid rgba(10,15,60,0.09)",background:"#eef0f7",fontFamily:"Montserrat,sans-serif",fontSize:14,color:"#0a0f2e",outline:"none" };
  return (
    <main style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"linear-gradient(160deg,#eef1fb,#f8faff 60%,#eafaf4 100%)"}}>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:24,padding:32,boxShadow:"0 8px 32px rgba(10,15,60,0.10)",border:"1px solid rgba(10,15,60,0.09)"}}>
        <div style={{fontFamily:"Montserrat,sans-serif",fontWeight:900,fontSize:22,letterSpacing:-.5,marginBottom:20}}>Nueva contraseña</div>
        {ok ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <p style={{fontWeight:700,color:"#00b88a"}}>¡Contraseña actualizada!</p>
            <p style={{fontSize:13,color:"#8087b0",marginTop:4}}>Redirigiendo...</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[{l:"Nueva contraseña",v:pw,s:setPw,ph:"Mínimo 6 caracteres"},{l:"Confirmar contraseña",v:c,s:setC,ph:"Repetí la contraseña"}].map(f=>(
              <div key={f.l}>
                <label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#8087b0",marginBottom:5}}>{f.l}</label>
                <input type="password" value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph} style={inp}/>
              </div>
            ))}
            {err && <p style={{fontSize:13,color:"#dc2626",fontWeight:600}}>{err}</p>}
            <button onClick={handle} disabled={load||!pw} style={{padding:"14px",borderRadius:100,border:"none",background:"#00b88a",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:15,cursor:"pointer",opacity:load||!pw?0.65:1}}>
              {load?"Guardando...":"Guardar contraseña →"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}