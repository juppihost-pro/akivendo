import { create } from "zustand";
import type { Usuario, Tienda, Pedido } from "@/lib/types";

interface AuthStore {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
}
export const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  setUsuario: (usuario) => set({ usuario }),
}));

interface MapaStore {
  ubicacionUsuario: { lat: number; lng: number } | null;
  tiendasCercanas: (Tienda & { distancia_metros?: number })[];
  categoriaActiva: string;
  pedidoActivo: Pedido | null;
  setUbicacion: (u: { lat: number; lng: number } | null) => void;
  setTiendasCercanas: (t: (Tienda & { distancia_metros?: number })[]) => void;
  setCategoriaActiva: (c: string) => void;
  setPedidoActivo: (p: Pedido | null) => void;
}
export const useMapaStore = create<MapaStore>((set) => ({
  ubicacionUsuario: null,
  tiendasCercanas: [],
  categoriaActiva: "todos",
  pedidoActivo: null,
  setUbicacion: (ubicacionUsuario) => set({ ubicacionUsuario }),
  setTiendasCercanas: (tiendasCercanas) => set({ tiendasCercanas }),
  setCategoriaActiva: (categoriaActiva) => set({ categoriaActiva }),
  setPedidoActivo: (pedidoActivo) => set({ pedidoActivo }),
}));

interface TiendaStore {
  tiendaActiva: Tienda | null;
  pedidosPendientes: Pedido[];
  setTiendaActiva: (t: Tienda | null) => void;
  setPedidos: (p: Pedido[]) => void;
  marcarEntregado: (id: string) => void;
}
export const useTiendaStore = create<TiendaStore>((set) => ({
  tiendaActiva: null,
  pedidosPendientes: [],
  setTiendaActiva: (tiendaActiva) => set({ tiendaActiva }),
  setPedidos: (pedidosPendientes) => set({ pedidosPendientes }),
  marcarEntregado: (id) => set((s) => ({
    pedidosPendientes: s.pedidosPendientes.map(p =>
      p.id === id ? { ...p, estado: "entregado" as const } : p
    ),
  })),
}));
