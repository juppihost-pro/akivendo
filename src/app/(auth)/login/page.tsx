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

  // Convierte cualquier error de Supabase a texto legible
  function textoError(e: unknown): string {
    if (!e) return "Error desconocido.";
    if (typeof e === "string") return e;
    if (typeof e === "object") {
      const obj = e as Record<string, unknown>;
      const m = obj.message ?? obj.msg ?? obj.error_description ?? obj.error ?? null;
      if (m && typeof m === "string" && m.trim() && m !== "{}") return trad(m);
      // Si el objeto no tiene mensaje útil, probamos stringify sólo para depurar
      const s = JSON.stringify(e);
      if (s !== "{}" && s !== "null") return s;
    }
    return "Ocurrió un error. Intentá de nuevo.";
  }

  function trad(m: string): string {
    if (!m) return "Error al procesar la solicitud.";
    if (m.includes("Invalid login credentials"))      return "Email o contraseña incorrectos.";
    if (m.includes("Email not confirmed"))             return "Confirmá tu email antes de entrar. Revisá tu bandeja de entrada.";
    if (m.includes("User already registered"))         return "Este email ya está registrado. Iniciá sesión.";
    if (m.includes("Password should be at least"))     return "La contraseña debe tener al menos 6 caracteres.";
    if (m.includes("Unable to validate email"))        return "El formato del email no es válido.";
    if (m.includes("Signup is disabled"))              return "El registro está deshabilitado. Contactá al administrador.";
    if (m.includes("over_email_send_rate_limit"))      return "Demasiados intentos. Esperá un momento e intentá de nuevo.";
    return m;
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 12,
    border: "1.5px solid #e2e6f0", background: "#fff",
    fontFamily: "Montserrat,sans-serif", fontSize: 14,
    color: "#1a1f36", outline: "none", transition: "border-color .2s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    letterSpacing: 1.5, textTransform: "uppercase" as const,
    color: "#8b95b0", marginBottom: 6,
  };

  function btnStyle(color: string): React.CSSProperties {
    const disabled = load || !email;
    return {
      width: "100%", padding: "15px", borderRadius: 100, border: "none",
      background: disabled ? "#a0c4ba" : color, color: "#fff",
      fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 15,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: 1,
      boxShadow: disabled ? "none" : `0 6px 20px ${color}50`,
      transition: "all .2s",
      letterSpacing: 0.3,
    };
  }

  async function doLogin() {
    setLoad(true); setErr(""); setMsg("");
    try {
      const sb = createClient();
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) { setErr(textoError(error)); setLoad(false); return; }
      if (!data.user) { setErr("No se pudo iniciar sesión. Intentá de nuevo."); setLoad(false); return; }
      const { data: perfil } = await sb.from("usuarios").select("rol").eq("id", data.user.id).single();
      if (perfil?.rol === "admin")         router.push("/admin/metricas");
      else if (perfil?.rol === "vendedor") router.push("/vendedor/perfil");
      else                                 router.push("/comprador/mapa");
    } catch (e) {
      setErr(textoError(e)); setLoad(false);
    }
  }

  async function doRegistro(esVendedor: boolean) {
    if (!nombre.trim())              { setErr("Ingresá tu nombre completo."); return; }
    if (pw.length < 6)               { setErr("La contraseña debe tener al menos 6 caracteres."); return; }
    if (esVendedor && !wa.trim())    { setErr("Ingresá tu número de WhatsApp para recibir pedidos."); return; }
    setLoad(true); setErr(""); setMsg("");
    try {
      const sb = createClient();
      const { data, error } = await sb.auth.signUp({
        email,
        password: pw,
        options: {
          data: {
            nombre:   nombre.trim(),
            rol:      esVendedor ? "vendedor" : "comprador",
            whatsapp: wa.trim(),
          },
        },
      });
      if (error) { setErr(textoError(error)); setLoad(false); return; }
      // Supabase devuelve user null cuando requiere confirmación de email
      if (!data.user || data.user.identities?.length === 0) {
        setMsg("✅ ¡Cuenta creada! Revisá tu bandeja de entrada (y spam) para confirmar tu email. Luego iniciá sesión.");
      } else {
        setMsg("✅ ¡Cuenta creada! Ya podés iniciar sesión.");
      }
      setModo("login"); setNombre(""); setPw(""); setWa(""); setLoad(false);
    } catch (e) {
      setErr(textoError(e)); setLoad(false);
    }
  }

  async function doRecuperar() {
    setLoad(true); setErr(""); setMsg("");
    try {
      const sb = createClient();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setErr(textoError(error)); setLoad(false); return; }
      setMsg("✅ Revisá tu email para restablecer tu contraseña."); setLoad(false);
    } catch (e) {
      setErr(textoError(e)); setLoad(false);
    }
  }

  function reset() { setErr(""); setMsg(""); }

  const titulos: Record<Modo, string> = {
    login:     "Iniciar sesión",
    recuperar: "Recuperar contraseña",
    comprador: "Crear cuenta de comprador",
    vendedor:  "Crear cuenta de vendedor",
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
      background: "linear-gradient(135deg, #eef1fb 0%, #f5f7ff 40%, #e8f7f2 100%)",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 38, letterSpacing: -2 }}>
            <span style={{ color: "#00b88a" }}>aki</span><span style={{ color: "#5b4ff5" }}>vendo</span>
          </div>
          <div style={{ fontSize: 14, color: "#8b95b0", marginTop: 5 }}>Comprá cerca de vos 📍</div>
        </div>

        {/* Tabs */}
        {(modo === "comprador" || modo === "vendedor") && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14,
            background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: 5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {(["comprador", "vendedor"] as const).map(m => (
              <button key={m} onClick={() => { setModo(m); reset(); }}
                style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none",
                  fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", transition: "all .2s",
                  background: modo === m ? "#fff" : "transparent",
                  color: modo === m ? "#1a1f36" : "#8b95b0",
                  boxShadow: modo === m ? "0 2px 10px rgba(0,0,0,0.08)" : "none" }}>
                {m === "comprador" ? "🛍️ Comprador" : "🏪 Vendedor"}
              </button>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "30px 28px",
          boxShadow: "0 8px 40px rgba(10,15,60,0.10)", border: "1px solid rgba(200,210,240,0.4)" }}>

          <h1 style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 21,
            letterSpacing: -0.5, marginBottom: 22, color: "#1a1f36" }}>
            {titulos[modo]}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Nombre */}
            {(modo === "comprador" || modo === "vendedor") && (
              <div>
                <label style={lbl}>Nombre completo</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre" style={inp} autoComplete="name" />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" style={inp} autoComplete="email"
                onKeyDown={e => e.key === "Enter" && modo === "login" && doLogin()} />
            </div>

            {/* Contraseña */}
            {modo !== "recuperar" && (
              <div>
                <label style={lbl}>Contraseña</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)}
                  placeholder={modo !== "login" ? "Mínimo 6 caracteres" : "••••••••"} style={inp}
                  autoComplete={modo === "login" ? "current-password" : "new-password"}
                  onKeyDown={e => e.key === "Enter" && modo === "login" && doLogin()} />
              </div>
            )}

            {/* WhatsApp para vendedor */}
            {modo === "vendedor" && (
              <div>
                <label style={lbl}>WhatsApp (sin código de país)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8,
                  ...inp, padding: "0 14px" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#8b95b0", flexShrink: 0 }}>+503</span>
                  <input type="tel" value={wa} onChange={e => setWa(e.target.value)}
                    placeholder="7000 0000"
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent",
                      fontFamily: "Montserrat,sans-serif", fontSize: 14, color: "#1a1f36",
                      padding: "13px 0" }} />
                </div>
                <p style={{ fontSize: 11, color: "#8b95b0", marginTop: 5, lineHeight: 1.6 }}>
                  Los compradores te enviarán pedidos a este número.
                </p>
              </div>
            )}

            {/* Error */}
            {err && (
              <div style={{ padding: "11px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.25)",
                color: "#dc2626", lineHeight: 1.5 }}>
                ⚠️ {err}
              </div>
            )}

            {/* Éxito */}
            {msg && (
              <div style={{ padding: "11px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                background: "rgba(0,184,138,0.07)", border: "1.5px solid rgba(0,184,138,0.3)",
                color: "#00996e", lineHeight: 1.5 }}>
                {msg}
              </div>
            )}

            {/* Botón principal */}
            <button
              disabled={load || !email}
              onClick={() => {
                if (modo === "login")      doLogin();
                else if (modo === "recuperar") doRecuperar();
                else                           doRegistro(modo === "vendedor");
              }}
              style={btnStyle(modo === "vendedor" ? "#5b4ff5" : "#00b88a")}>
              {load ? "Cargando..." :
               modo === "login"      ? "Entrar →" :
               modo === "recuperar"  ? "Enviar email de recuperación →" :
               "Crear cuenta →"}
            </button>

            {/* Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8,
              alignItems: "center", paddingTop: 4 }}>
              {modo === "login" && (
                <>
                  <div style={{ display: "flex", gap: 6, fontSize: 13, color: "#8b95b0" }}>
                    <span>¿No tenés cuenta?</span>
                    <button onClick={() => { setModo("comprador"); reset(); }}
                      style={{ background: "none", border: "none", color: "#00b88a",
                        fontWeight: 700, cursor: "pointer", fontFamily: "Montserrat,sans-serif",
                        fontSize: 13 }}>
                      Registrate
                    </button>
                  </div>
                  <button onClick={() => { setModo("recuperar"); reset(); }}
                    style={{ background: "none", border: "none", fontSize: 13,
                      color: "#8b95b0", cursor: "pointer", fontFamily: "Montserrat,sans-serif" }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </>
              )}
              {modo !== "login" && (
                <button onClick={() => { setModo("login"); reset(); }}
                  style={{ background: "none", border: "none", fontSize: 13,
                    color: "#8b95b0", cursor: "pointer", fontFamily: "Montserrat,sans-serif" }}>
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
