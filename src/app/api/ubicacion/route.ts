import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"No autenticado" }, { status:401 });
  const { lat, lng, tienda_id } = await req.json();
  if (!lat || !lng || !tienda_id) return NextResponse.json({ error:"Datos incompletos" }, { status:400 });
  const { error } = await supabase.from("tiendas").update({ lat_actual:lat, lng_actual:lng, ultima_ubicacion:new Date().toISOString() }).eq("id", tienda_id).eq("vendedor_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}