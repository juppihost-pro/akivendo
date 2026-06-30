export const PUNTOS_POR_DOLAR = 5;
export const RADIO_VENDEDOR_METROS = 3000;
export const INTERVALO_UBICACION_MS = 8000;
export const CHANNEL_UBICACIONES = "akivendo-ubicaciones";
export const CHANNEL_PEDIDOS = "akivendo-pedidos";
export const MAPA_DEFAULT = { lat: 13.6929, lng: -89.2182, zoom: 14 };
export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const NIVELES = {
  frecuente: { label: "Comprador Frecuente", emoji: "🛍️", min: 0,    color: "#00b88a" },
  oro:       { label: "Comprador Oro",       emoji: "🥇", min: 500,  color: "#f59e0b" },
  platinum:  { label: "Platinum",            emoji: "💎", min: 2000, color: "#8b5cf6" },
  diamante:  { label: "Diamante",            emoji: "✨", min: 5000, color: "#06b6d4" },
} as const;

export const CATEGORIAS_VENDEDOR = [
  { id: "ambulante",  nombre: "Ambulante",       emoji: "🚶" },
  { id: "zapatero",   nombre: "Zapatería",        emoji: "👟" },
  { id: "costurera",  nombre: "Costura y Moda",   emoji: "🧵" },
  { id: "tienda",     nombre: "Tienda de Barrio",  emoji: "🏪" },
  { id: "mercado",    nombre: "Mercado Comunal",   emoji: "🛒" },
  { id: "comida",     nombre: "Comida y Bebidas",  emoji: "🍽️" },
  { id: "otro",       nombre: "Otro Negocio",      emoji: "💼" },
] as const;
