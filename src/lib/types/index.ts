export type Rol = "comprador" | "vendedor" | "admin";
export type NivelLealtad = "frecuente" | "oro" | "platinum" | "diamante";
export type EstadoPedido = "pendiente" | "confirmado" | "en_camino" | "entregado" | "cancelado";

export interface Usuario {
  id: string; nombre: string; email?: string; telefono?: string;
  rol: Rol; puntos_acumulados: number; nivel: NivelLealtad;
  avatar_url?: string; activo: boolean; creado_en: string;
}
export interface CategoriaVendedor { id: string; nombre: string; emoji: string; descripcion?: string; }
export interface Tienda {
  id: string; vendedor_id: string; nombre: string; descripcion?: string;
  categoria_id: string; whatsapp: string; logo_url?: string;
  lat_actual?: number; lng_actual?: number; ultima_ubicacion?: string;
  activa: boolean; es_ambulante: boolean; ciudad?: string; horario?: string; creado_en: string;
  vendedor?: Usuario; categoria?: CategoriaVendedor;
}
export interface Producto {
  id: string; nombre: string; descripcion?: string; precio: number;
  imagen_url?: string; tienda_id?: string; activo: boolean; creado_en: string;
}
export interface Pedido {
  id: string; comprador_id: string; tienda_id: string; estado: EstadoPedido;
  total: number; pasaje?: string; numero_casa?: string;
  lat_entrega?: number; lng_entrega?: number; notas?: string;
  puntos_ganados: number; whatsapp_enviado: boolean;
  creado_en: string; actualizado_en: string;
  comprador?: Usuario; tienda?: Tienda; detalle?: DetallePedido[];
}
export interface DetallePedido {
  id: string; pedido_id: string; producto_id: string;
  cantidad: number; precio_unitario: number; subtotal?: number; producto?: Producto;
}
export interface MovimientoPuntos {
  id: string; usuario_id: string; pedido_id?: string;
  puntos: number; concepto: string; creado_en: string;
}
export interface Rifa {
  id: string; titulo: string; descripcion?: string; imagen_url?: string;
  puntos_requeridos: number; fecha_sorteo: string; activa: boolean;
  ganador_id?: string; creado_en: string;
}
