"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Modo = "login" | "comprador" | "vendedor" | "recuperar";

export default function LoginPage() {
  const router = useRouter();
  const [modo,   setModo]   = useState<Modo>("login");
  const [nombre, setNombre] = useState("");
  const [email,  setEmail]  = useState("");
  const [pw,     setPw]     = useState("");
  const [wa,     setWa]     = useState("");
  const [err,    setErr]    = useState("");
  const [msg,    setMsg]    = useState("");
  const [load,   setLoad]   = useState(false);

  function trad(m: string) {
    if (m.includes("Invalid login"))   return "Email o contraseña incorrectos.";
    if (m.includes("not confirmed"))   return "Confirmá tu email antes de entrar.";
    if (m.includes("User already"))    return "Este email ya está registrado.";
    if (m.includes("Password should")) return "Mínimo 6 caracteres.";
    return m;
  }

  const inp: React.CSSProperties = {
    width:"100%", padding:"12px 14px", borderRadius:12,
    border:"1px solid rgba(10,15,60,0.09)", background:"#e8ebf5",
    fontFamily:"Montserrat,sans-serif", fontSize:14, color:"#0a0f2e", outline:"none",
  };
  const lbl: React.CSSProperties = {
    display:"block", fontSize:11, fontWeight:700, letterSpacing:1,
    textTransform:"uppercase" as const, color:"#8087b0", marginBottom:5,
  };

  function btnStyle(color: string): React.CSSProperties {
    return {
      width:"100%", padding:"14px", borderRadius:100, border:"none",
      background: color, color:"#fff",
      fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:15,
      cursor: (load || !email) ? "not-allowed" : "pointer",
      opacity: (load || !email) ? 0.65 : 1,
      boxShadow: `0 6px 20px ${color}40`,
    };
  }

  async function login() {
    setLoad(true); setErr(""); setMsg("");
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr(trad(error.message)); setLoad(false); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoad(false); return; }
    const { data: perfil } = await sb.from("usuarios").select("rol").eq("id", user.id).single();
    if (perfil?.rol === "admin")       router.push("/admin/metricas");
    else if (perfil?.rol === "vendedor") router.push("/vendedor/perfil");
    else                               router.push("/comprador/mapa");
  }

  async function registro(esVendedor: boolean) {
    if (!nombre.trim())        { setErr("Ingresá tu nombre."); return; }
    if (pw.length < 6)         { setErr("Mínimo 6 caracteres."); return; }
    if (esVendedor && !wa.trim()) { setErr("Ingresá tu número de WhatsApp."); return; }
    setLoad(true); setErr(""); setMsg("");
    const { error } = await createClient().auth.signUp({
      email, password: pw,
      options: { data: { nombre: nombre.trim(), rol: esVendedor ? "vendedor" : "comprador", whatsapp: wa.trim() } },
    });
    if (error) { setErr(trad(error.message)); setLoad(false); return; }
    setMsg("✅ Cuenta creada. Revisá tu email para confirmarla y luego iniciá sesión.");
    setModo("login"); setLoad(false);
  }

  async function recuperar() {
    setLoad(true); setErr(""); setMsg("");
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setErr(trad(error.message)); setLoad(false); return; }
    setMsg("✅ Revisá tu email para restablecer tu contraseña."); setLoad(false);
  }

  function reset() { setErr(""); setMsg(""); }

  return (
    <main style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", background:"linear-gradient(160deg,#eef1fb,#f8faff 60%,#eafaf4 100%)" }}>
      <div style={{ width:"100%", maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:36, letterSpacing:-2 }}>
            <span style={{ color:"#00b88a" }}>aki</span><span style={{ color:"#5b4ff5" }}>vendo</span>
          </div>
          <div style={{ fontSize:13, color:"#8087b0", marginTop:4 }}>Comprá cerca de vos 📍</div>
        </div>

        {/* Tabs comprador / vendedor */}
        {(modo === "comprador" || modo === "vendedor") && (
          <div style={{ display:"flex", gap:8, marginBottom:14, background:"#e8ebf5", borderRadius:14, padding:4 }}>
            {(["comprador","vendedor"] as const).map(m => (
              <button key={m} onClick={() => { setModo(m); reset(); }}
                style={{ flex:1, padding:"9px", borderRadius:10, border:"none",
                  fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:13, cursor:"pointer",
                  background: modo === m ? "#fff" : "transparent",
                  color: modo === m ? "#0a0f2e" : "#8087b0",
                  boxShadow: modo === m ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
                {m === "comprador" ? "🛍️ Comprador" : "🏪 Vendedor"}
              </button>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background:"#fff", borderRadius:24, padding:28, border:"1px solid rgba(10,15,60,0.09)", boxShadow:"0 8px 32px rgba(10,15,60,0.10)" }}>
          <h1 style={{ fontFamily:"Montserrat,sans-serif", fontWeight:900, fontSize:20, letterSpacing:-.5, marginBottom:20, color:"#0a0f2e" }}>
            { modo === "login"      ? "Iniciar sesión"
            : modo === "recuperar" ? "Recuperar contraseña"
            : modo === "comprador" ? "Crear cuenta de comprador"
            :                        "Crear cuenta de vendedor" }
          </h1>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

            {/* Nombre */}
            {(modo === "comprador" || modo === "vendedor") && (
              <div>
                <label style={lbl}>Nombre completo</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" style={inp} />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" style={inp}
                onKeyDown={e => e.key === "Enter" && modo === "login" && login()} />
            </div>

            {/* Contraseña */}
            {modo !== "recuperar" && (
              <div>
                <label style={lbl}>Contraseña</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                  placeholder={modo !== "login" ? "Mínimo 6 caracteres" : "••••••••"} style={inp}
                  onKeyDown={e => e.key === "Enter" && modo === "login" && login()} />
              </div>
            )}

            {/* WhatsApp solo para vendedor */}
            {modo === "vendedor" && (
              <div>
                <label style={lbl}>WhatsApp (sin código de país)</label>
                <div style={{ display:"flex", alignItems:"center", gap:8, background:"#e8ebf5", borderRadius:12, border:"1px solid rgba(10,15,60,0.09)", padding:"0 12px" }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#8087b0" }}>+503</span>
                  <input type="tel" value={wa} onChange={e => setWa(e.target.value)}
                    placeholder="7000 0000"
                    style={{ ...inp, background:"transparent", border:"none", padding:"12px 0" }} />
                </div>
                <p style={{ fontSize:11, color:"#8087b0", marginTop:4, lineHeight:1.5 }}>
                  Los pedidos de tus compradores llegarán a este WhatsApp.
                </p>
              </div>
            )}

            {/* Mensajes */}
            {err && <div style={{ padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#dc2626" }}>{err}</div>}
            {msg && <div style={{ padding:"10px 14px", borderRadius:10, fontSize:13, fontWeight:600, background:"rgba(0,184,138,0.08)", border:"1px solid rgba(0,184,138,0.25)", color:"#00b88a" }}>{msg}</div>}

            {/* Botón principal */}
            <button
              disabled={load || !email}
              onClick={() => {
                if (modo === "login")      login();
                else if (modo === "recuperar") recuperar();
                else                           registro(modo === "vendedor");
              }}
              style={btnStyle(modo === "vendedor" ? "#5b4ff5" : "#00b88a")}>
              { load           ? "Cargando..."
              : modo === "login"      ? "Entrar →"
              : modo === "recuperar"  ? "Enviar email →"
              :                         "Crear cuenta →" }
            </button>

            {/* Links secundarios */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center", paddingTop:4 }}>
              {modo === "login" && <>
                <div style={{ display:"flex", gap:8, fontSize:13, color:"#8087b0" }}>
                  <span>¿Sin cuenta?</span>
                  <button onClick={() => { setModo("comprador"); reset(); }}
                    style={{ background:"none", border:"none", color:"#00b88a", fontWeight:700, cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontSize:13 }}>
                    Registrate
                  </button>
                </div>
                <button onClick={() => { setModo("recuperar"); reset(); }}
                  style={{ background:"none", border:"none", fontSize:13, color:"#8087b0", cursor:"pointer", fontFamily:"Montserrat,sans-serif" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </>}
              {modo !== "login" && (
                <button onClick={() => { setModo("login"); reset(); }}
                  style={{ background:"none", border:"none", fontSize:13, color:"#8087b0", cursor:"pointer", fontFamily:"Montserrat,sans-serif" }}>
                  ← Volver al inicio de sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
