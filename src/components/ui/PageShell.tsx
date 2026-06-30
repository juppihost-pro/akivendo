"use client";
import { NavBar } from "./NavBar";
export function PageShell({ children, title, back }: { children: React.ReactNode; title?: string; back?: boolean }) {
  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column" }}>
      {title && (
        <header style={{ position:"sticky",top:0,zIndex:40,background:"var(--card)",
          borderBottom:"1px solid var(--border)",padding:"14px 18px",
          display:"flex",alignItems:"center",gap:12 }}>
          {back && <button onClick={() => history.back()} style={{ width:32,height:32,borderRadius:"50%",
            background:"var(--bg3)",border:"none",cursor:"pointer",fontSize:16,
            color:"var(--muted)" }}>←</button>}
          <h1 style={{ fontFamily:"Montserrat,sans-serif",fontWeight:900,fontSize:18,
            letterSpacing:-.5,color:"var(--text)" }}>{title}</h1>
        </header>
      )}
      <main style={{ flex:1,paddingBottom:80 }}>{children}</main>
      <NavBar />
    </div>
  );
}
