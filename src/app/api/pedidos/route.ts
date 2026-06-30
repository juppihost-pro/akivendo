import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"No autenticado" }, { status:401 });
  const { searchParams } = new URL(req.url);
  const tiendaId = searchParams.get("tienda_id");
  const compradorId = searchParams.get("comprador_id");
  let q = supabase.from("pedidos").select("*, comprador:usuarios(nombre,email), tienda:tiendas(nombre,whatsapp), detalle:detalle_pedido(*, producto:productos(nombre,precio))").order("creado_en",{ascending:false});
  if (tiendaId)    q = q.eq("tienda_id", tiendaId);
  if (compradorId) q = q.eq("comprador_id", compradorId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data);
}
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"No autenticado" }, { status:401 });
  const body = await req.json();
  const { tienda_id, pasaje, numero_casa, lat_entrega, lng_entrega, notas, items } = body;
  if (!tienda_id || !items?.length) return NextResponse.json({ error:"Datos incompletos" }, { status:400 });
  const ids = items.map((i: any) => i.producto_id);
  const { data: productos } = await supabase.from("productos").select("id,precio").in("id", ids);
  const precioMap: Record<string,number> = {};
  (productos??[]).forEach((p: any) => { precioMap[p.id] = p.precio; });
  const total = items.reduce((s: number, i: any) => s + (precioMap[i.producto_id]??0) * i.cantidad, 0);
  const { data: pedido, error } = await supabase.from("pedidos").insert({ comprador_id:user.id, tienda_id, estado:"pendiente", total, pasaje, numero_casa, lat_entrega, lng_entrega, notas: notas||null }).select().single();
  if (error || !pedido) return NextResponse.json({ error: error?.message }, { status:500 });
  const detalle = items.map((i: any) => ({ pedido_id:pedido.id, producto_id:i.producto_id, cantidad:i.cantidad, precio_unitario:precioMap[i.producto_id]??0 }));
  await supabase.from("detalle_pedido").insert(detalle);
  return NextResponse.json(pedido, { status:201 });
}