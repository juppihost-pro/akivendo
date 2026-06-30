"use client";
import { useRouter } from "next/navigation";
export default function LandingPage() {
  const router = useRouter();
  return (
    <div style={{fontFamily:"Montserrat,sans-serif",background:"#f2f4fb",minHeight:"100vh"}}>
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:"rgba(242,244,251,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(10,15,60,0.09)"}}>
        <div style={{fontWeight:900,fontSize:22,letterSpacing:-1}}><span style={{color:"#00b88a"}}>aki</span><span style={{color:"#5b4ff5"}}>vendo</span></div>
        <button onClick={()=>router.push("/login")} style={{padding:"9px 22px",borderRadius:100,border:"none",background:"#00b88a",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:13,cursor:"pointer"}}>Entrar</button>
      </nav>
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"110px 24px 80px",textAlign:"center"}}>
        <h1 style={{fontFamily:"Montserrat,sans-serif",fontSize:"clamp(38px,7vw,76px)",fontWeight:900,lineHeight:1,letterSpacing:-3,color:"#0a0f2e",marginBottom:20}}>
          Tu mercado de barrio,<br/><em style={{color:"#00b88a",fontStyle:"italic"}}>en tu celular.</em>
        </h1>
        <p style={{fontSize:17,color:"#3d4470",maxWidth:480,lineHeight:1.8,marginBottom:36}}>
          Encontrá zapateros, costureras, tiendas de barrio y vendedores ambulantes cerca de tu casa. Pedí por <strong>WhatsApp</strong> y ganá puntos en cada compra.
        </p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>router.push("/login")} style={{background:"#00b88a",color:"#fff",fontFamily:"Montserrat,sans-serif",fontWeight:800,fontSize:16,padding:"16px 36px",borderRadius:100,border:"none",cursor:"pointer",boxShadow:"0 6px 24px rgba(0,184,138,0.35)"}}>Explorar vendedores →</button>
          <button onClick={()=>router.push("/login")} style={{background:"transparent",color:"#5b4ff5",fontFamily:"Montserrat,sans-serif",fontWeight:700,fontSize:16,padding:"16px 36px",borderRadius:100,border:"1.5px solid #5b4ff5",cursor:"pointer"}}>Soy vendedor 🏪</button>
        </div>
      </section>
    </div>
  );
}