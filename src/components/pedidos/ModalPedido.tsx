"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { useMapaStore, useAuthStore } from "@/store";
import { calcularPuntos, formatPrecio, abrirWhatsApp } from "@/lib/utils";
import type { Tienda, Producto } from "@/lib/types";
import { CATEGORIAS_VENDEDOR } from "@/lib/constants";

interface Props { tienda: Tienda & { categoria?: any; vendedor?: any }; onClose: () => void; }
interface Item { producto: Producto; cantidad: number; }

export default function ModalPedido({ tienda, onClose }: Props) {
  const usuario   = useAuthStore(s => s.usuario);
  const ubicacion = useMapaStore(s => s.ubicacionUsuario);

  const [productos,  setProductos]  = useState<Producto[]>([]);
  const [carrito,    setCarrito]    = useState<Item[]>([]);
  const [pasaje,     setPasaje]     = useState("");
  const [casa,       setCasa]       = useState("");
  const [notas,      setNotas]      = useState("");
  const [paso,       setPaso]       = useState<"productos"|"dir"|"ok">("productos");
  const [cargando,   setCargando]   = useState(true);
  const [enviando,   setEnviando]   = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");

  const cat = CATEGORIAS_VENDEDOR.find(c => c.id === tienda.categoria_id);

  const cargar = useCallback(async () => {
    setCargando(true); setErrorMsg("");
    const supabase = createClient();
    let { data, error } = await supabase.from("productos")
      .select("*").eq("tienda_id", tienda.id).eq("activo", true).order("nombre");
    if (!error && (!data || data.length === 0)) {
      const res = await supabase.from("productos").select("*").eq("activo", true).order("nombre");
      data = res.data; error = res.error;
    }
    if (error) { setErrorMsg(error.message); } else setProductos(data as Producto[] ?? []);
    setCargando(false);
  }, [tienda.id]);

  useEffect(() => { cargar(); }, [cargar]);

  function cambiar(p: Producto, d: number) {
    setCarrito(prev => {
      const ex = prev.find(i => i.producto.id === p.id);
      if (!ex && d > 0) return [...prev, { producto: p, cantidad: 1 }];
      if (!ex) return prev;
      const n = ex.cantidad + d;
      if (n <= 0) return prev.filter(i => i.producto.id !== p.id);
      return prev.map(i => i.producto.id === p.id ? { ...i, cantidad: n } : i);
    });
  }

  const total  = carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const puntos = calcularPuntos(total);

  async function confirmar() {
    if (!usuario) return;
    setEnviando(true); setErrorMsg("");
    const supabase = createClient();
    const lat = ubicacion?.lat ?? 13.6929;
    const lng = ubicacion?.lng ?? -89.2182;

    const { data: pedido, error: err1 } = await supabase.from("pedidos")
      .insert({ comprador_id: usuario.id, tienda_id: tienda.id, estado: "pendiente",
        total, pasaje, numero_casa: casa, lat_entrega: lat, lng_entrega: lng, notas: notas || null })
      .select("*, comprador:usuarios(nombre,email)").single();

    if (err1 || !pedido) { setErrorMsg(err1?.message ?? "Error al crear pedido"); setEnviando(false); return; }

    const detalle = carrito.map(i => ({
      pedido_id: pedido.id, producto_id: i.producto.id,
      cantidad: i.cantidad, precio_unitario: i.producto.precio
    }));
    await supabase.from("detalle_pedido").insert(detalle);

    const pedidoCompleto = { ...pedido, tienda, detalle: carrito.map(i => ({ ...i, producto: i.producto, precio_unitario: i.producto.precio })) };
    abrirWhatsApp(tienda.whatsapp, pedidoCompleto);
    await supabase.from("pedidos").update({ whatsapp_enviado: true }).eq("id", pedido.id);

    setPaso("ok");
    setEnviando(false);
  }

  const inp: React.CSSProperties = { width:"100%", padding:"12px 14px", borderRadius:12,
    border:"1px solid var(--border)", background:"var(--bg3)", fontFamily:"Montserrat,sans-serif",
    fontSize:14, color:"var(--text)", outline:"none" };

  if (paso === "ok") return (
    <Modal open onClose={onClose} title="¡Pedido enviado! 🎉">
      <div style={{ textAlign:"center", padding:"8px 0", display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:60 }}>✅</div>
        <div>
          <p style={{ fontWeight:900, fontSize:20, letterSpacing:-0.5, marginBottom:8 }}>Tu pedido fue enviado</p>
          <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7 }}>
            Se abrió WhatsApp con el mensaje para{" "}
            <strong>{tienda.nombre}</strong>.
            El vendedor te confirmará el pedido.
          </p>
        </div>
        <div style={{ background:"var(--bg3)", borderRadius:16, padding:16,
          border:"1px solid var(--border)" }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
            letterSpacing:1, color:"var(--muted)", marginBottom:4 }}>Total pagás en efectivo</div>
          <div style={{ fontSize:36, fontWeight:900, color:"var(--teal)", letterSpacing:-2 }}>
            {formatPrecio(total)}
          </div>
          <div style={{ fontSize:12, color:"var(--teal)", marginTop:4, fontWeight:600 }}>
            +{puntos} puntos al confirmar recepción
          </div>
        </div>
        <button onClick={onClose} style={{ padding:"14px", borderRadius:100, border:"none",
          background:"var(--teal)", color:"#fff", fontFamily:"Montserrat,sans-serif",
          fontWeight:800, fontSize:15, cursor:"pointer" }}>
          Cerrar
        </button>
      </div>
    </Modal>
  );

  if (paso === "dir") return (
    <Modal open onClose={() => { onClose(); }} title="¿Dónde entregamos?" size="md">
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ background:"var(--bg3)", borderRadius:14, padding:14, border:"1px solid var(--border)" }}>
          {carrito.map(i => (
            <div key={i.producto.id} style={{ display:"flex", justifyContent:"space-between",
              fontSize:13, fontWeight:500, padding:"4px 0" }}>
              <span>{i.cantidad}× {i.producto.nombre}</span>
              <span style={{ fontWeight:700 }}>{formatPrecio(i.producto.precio * i.cantidad)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:900,
            fontSize:15, paddingTop:8, borderTop:"1px solid var(--border)", marginTop:6 }}>
            <span>Total</span><span style={{ color:"var(--teal)" }}>{formatPrecio(total)}</span>
          </div>
        </div>
        {[
          { label:"Pasaje / Calle", val:pasaje, set:setPasaje, ph:"Ej. Pasaje Los Robles" },
          { label:"Número de casa", val:casa, set:setCasa, ph:"Ej. Casa #14" },
          { label:"Notas (opcional)", val:notas, set:setNotas, ph:"Ej. Timbrar 2 veces" },
        ].map(f => (
          <div key={f.label}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1,
              textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>{f.label}</label>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inp} />
          </div>
        ))}
        <div style={{ padding:"10px 14px", borderRadius:12, background:"rgba(37,211,102,0.08)",
          border:"1px solid rgba(37,211,102,0.25)", fontSize:13, color:"var(--text2)",
          display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>💬</span>
          <span>El pedido se enviará por <strong>WhatsApp</strong> al vendedor. Pago en efectivo al recibir.</span>
        </div>
        {errorMsg && <div style={{ padding:"10px 14px", borderRadius:12, fontSize:13, color:"#dc2626",
          background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)" }}>{errorMsg}</div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setPaso("productos")} style={{ flex:1, padding:"13px", borderRadius:100,
            border:"1.5px solid var(--border)", background:"transparent", color:"var(--text)",
            fontFamily:"Montserrat,sans-serif", fontWeight:700, fontSize:14, cursor:"pointer" }}>← Volver</button>
          <button onClick={confirmar} disabled={enviando || !pasaje.trim() || !casa.trim()}
            style={{ flex:2, padding:"13px", borderRadius:100, border:"none",
              background: enviando || !pasaje.trim() || !casa.trim() ? "var(--bg3)" : "var(--teal)",
              color: enviando || !pasaje.trim() || !casa.trim() ? "var(--muted)" : "#fff",
              fontFamily:"Montserrat,sans-serif", fontWeight:800, fontSize:14, cursor:"pointer",
              boxShadow: enviando ? "none" : "0 4px 14px rgba(0,184,138,0.3)" }}>
            {enviando ? "Enviando..." : "💬 Enviar por WhatsApp"}
          </button>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal open onClose={onClose} title={`${cat?.emoji ?? "🏪"} ${tienda.nombre}`} size="lg">
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {tienda.descripcion && (
          <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6,
            padding:"10px 14px", background:"var(--bg3)", borderRadius:12 }}>
            {tienda.descripcion}
          </p>
        )}
        {cargando && (
          <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted)" }}>
            ⏳ Cargando productos...
          </div>
        )}
        {!cargando && errorMsg && (
          <div style={{ padding:"12px", borderRadius:12, background:"rgba(239,68,68,0.08)",
            fontSize:13, color:"#dc2626" }}>
            {errorMsg}
            <button onClick={cargar} style={{ display:"block", marginTop:6, color:"var(--teal)",
              background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>Reintentar</button>
          </div>
        )}
        {!cargando && !errorMsg && productos.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📦</div>
            <p style={{ fontWeight:700 }}>Sin productos cargados</p>
            <p style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>El vendedor aún no agregó productos.</p>
          </div>
        )}
        {!cargando && productos.map(p => {
          const en = carrito.find(i => i.producto.id === p.id);
          return (
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px",
              borderRadius:16, background: en ? "var(--tealBg)" : "var(--bg3)",
              border:`1px solid ${en ? "var(--tealBorder)" : "var(--border)"}`,
              transition:"all .2s" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:14, letterSpacing:-0.3 }}>{p.nombre}</div>
                {p.descripcion && <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{p.descripcion}</div>}
                <div style={{ fontWeight:900, fontSize:16, color:"var(--teal)", marginTop:4 }}>{formatPrecio(p.precio)}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {en && (
                  <>
                    <button onClick={() => cambiar(p, -1)} style={{ width:30, height:30, borderRadius:"50%",
                      border:"1.5px solid var(--border)", background:"var(--bg2)", fontSize:18,
                      fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
                    <span style={{ fontWeight:900, fontSize:16, minWidth:18, textAlign:"center" }}>{en.cantidad}</span>
                  </>
                )}
                <button onClick={() => cambiar(p, 1)} style={{ width:30, height:30, borderRadius:"50%",
                  border:"none", background:"var(--teal)", color:"#fff", fontSize:20, fontWeight:900,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 2px 8px rgba(0,184,138,0.35)" }}>+</button>
              </div>
            </div>
          );
        })}
        {carrito.length > 0 && (
          <div style={{ position:"sticky", bottom:0, background:"var(--card)", borderRadius:16,
            border:"2px solid var(--teal)", padding:"12px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            boxShadow:"0 -4px 20px rgba(0,0,0,0.08)" }}>
            <div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>Total estimado</div>
              <div style={{ fontWeight:900, fontSize:22, color:"var(--teal)", letterSpacing:-1 }}>{formatPrecio(total)}</div>
              <div style={{ fontSize:11, color:"var(--muted)" }}>+{puntos} puntos al recibir</div>
            </div>
            <button onClick={() => setPaso("dir")} style={{ padding:"12px 22px", borderRadius:100,
              border:"none", background:"var(--teal)", color:"#fff", fontFamily:"Montserrat,sans-serif",
              fontWeight:800, fontSize:14, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,184,138,0.3)" }}>
              Pedir →
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
