import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NIVELES, PUNTOS_POR_DOLAR } from "@/lib/constants";
import type { NivelLealtad } from "@/lib/types";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function calcularPuntos(total: number): number {
  return Math.floor(total * PUNTOS_POR_DOLAR);
}

export function nivelPorPuntos(puntos: number): NivelLealtad {
  if (puntos >= NIVELES.diamante.min) return "diamante";
  if (puntos >= NIVELES.platinum.min) return "platinum";
  if (puntos >= NIVELES.oro.min) return "oro";
  return "frecuente";
}

export function progresoNivel(puntos: number): number {
  if (puntos >= NIVELES.diamante.min) return 100;
  if (puntos >= NIVELES.platinum.min) {
    return Math.round(((puntos - NIVELES.platinum.min) / (NIVELES.diamante.min - NIVELES.platinum.min)) * 100);
  }
  if (puntos >= NIVELES.oro.min) {
    return Math.round(((puntos - NIVELES.oro.min) / (NIVELES.platinum.min - NIVELES.oro.min)) * 100);
  }
  return Math.round((puntos / NIVELES.oro.min) * 100);
}

export function distanciaMetros(la1: number, ln1: number, la2: number, ln2: number): number {
  const R = 6371000, d1 = ((la2-la1)*Math.PI)/180, d2 = ((ln2-ln1)*Math.PI)/180;
  const a = Math.sin(d1/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(d2/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function formatDistancia(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
}

export function formatPrecio(p: number): string { return `$${p.toFixed(2)}`; }

export function generarMensajeWhatsApp(pedido: any, tienda: any): string {
  const items = pedido.detalle?.map((d: any) =>
    `  • ${d.cantidad}× ${d.producto?.nombre} — $${(d.precio_unitario * d.cantidad).toFixed(2)}`
  ).join("\n") ?? "";
  return encodeURIComponent(
    `🛒 *Nuevo pedido en akivendo*\n\n` +
    `👤 Cliente: ${pedido.comprador?.nombre ?? "Sin nombre"}\n` +
    `📍 Dirección: ${pedido.pasaje ?? ""} ${pedido.numero_casa ?? ""}\n` +
    `\n📦 Productos:\n${items}\n` +
    `\n💵 *Total: $${pedido.total?.toFixed(2)}* (pago en efectivo)\n` +
    `\n¡Confirmá el pedido respondiendo este mensaje! 🙌`
  );
}

export function abrirWhatsApp(numero: string, pedido: any): void {
  const limpio = numero.replace(/\D/g, "");
  const full   = limpio.startsWith("503") ? limpio : `503${limpio}`;
  const msg    = generarMensajeWhatsApp(pedido, pedido.tienda);
  window.open(`https://wa.me/${full}?text=${msg}`, "_blank");
}
