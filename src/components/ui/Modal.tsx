"use client";
import { useEffect } from "react";
interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: "sm"|"md"|"lg"; }
export function Modal({ open, onClose, title, children, size="md" }: ModalProps) {
  useEffect(() => { document.body.style.overflow = open?"hidden":""; return () => { document.body.style.overflow=""; }; }, [open]);
  if (!open) return null;
  const maxW = { sm:"380px",md:"520px",lg:"680px" }[size];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",
      justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:maxW,background:"var(--card)",borderRadius:"24px 24px 0 0",
        border:"1px solid var(--border)",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)",
        maxHeight:"92vh",overflowY:"auto" }}>
        {title && (
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"18px 20px 14px",borderBottom:"1px solid var(--border)",
            position:"sticky",top:0,background:"var(--card)",zIndex:1 }}>
            <h2 style={{ fontFamily:"Montserrat,sans-serif",fontWeight:900,fontSize:17,
              letterSpacing:-.5,color:"var(--text)" }}>{title}</h2>
            <button onClick={onClose} style={{ width:30,height:30,borderRadius:"50%",
              background:"var(--bg3)",border:"none",cursor:"pointer",fontSize:16,
              color:"var(--muted)" }}>×</button>
          </div>
        )}
        <div style={{ padding:"16px 20px 24px" }}>{children}</div>
      </div>
    </div>
  );
}
