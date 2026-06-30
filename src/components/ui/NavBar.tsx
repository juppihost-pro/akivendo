"use client";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store";
import type { Rol } from "@/lib/types";

const navComprador = [
  { href:"/comprador/mapa",    icon:"🗺️",  label:"Cerca" },
  { href:"/comprador/pedidos", icon:"📦",  label:"Pedidos" },
  { href:"/comprador/puntos",  icon:"⭐",  label:"Puntos" },
  { href:"/comprador/rifas",   icon:"🎁",  label:"Rifas" },
];
const navVendedor = [
  { href:"/vendedor/perfil",    icon:"🏪", label:"Tienda" },
  { href:"/vendedor/productos", icon:"💧", label:"Productos" },
  { href:"/vendedor/pedidos",   icon:"📋", label:"Pedidos" },
  { href:"/vendedor/historial", icon:"📊", label:"Ventas" },
];
const navAdmin = [
  { href:"/admin/metricas",   icon:"📊", label:"Dashboard" },
  { href:"/admin/categorias", icon:"🗂️",  label:"Categorías" },
  { href:"/admin/vendedores", icon:"👥", label:"Usuarios" },
  { href:"/admin/rifas",      icon:"🎁", label:"Rifas" },
];

const navByRol: Record<Rol, typeof navComprador> = {
  comprador: navComprador,
  vendedor:  navVendedor,
  admin:     navAdmin,
};

export function NavBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const usuario  = useAuthStore(s => s.usuario);
  const supabase = createClient();
  if (!usuario) return null;

  const items = navByRol[usuario.rol] ?? navComprador;
  const todos = [...items, { href:"__salir__", icon:"🚪", label:"Salir" }];

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:50,
      background:"var(--card)", borderTop:"1px solid var(--border)",
      paddingBottom:"env(safe-area-inset-bottom, 8px)",
    }}>
      <div style={{ display:"flex", width:"100%" }}>
        {todos.map(item => {
          const active = item.href !== "__salir__" && pathname.startsWith(item.href);
          return (
            <button key={item.href}
              onClick={() => item.href === "__salir__" ? cerrarSesion() : router.push(item.href)}
              style={{
                flex:"1 1 0", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                gap:3, padding:"10px 4px 8px",
                border:"none", background:"transparent", cursor:"pointer",
                color: active ? "var(--teal)" : "var(--muted)",
                transition:"color .15s",
              }}>
              <span style={{ fontSize:21, lineHeight:1 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:.3, fontFamily:"Montserrat,sans-serif" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
