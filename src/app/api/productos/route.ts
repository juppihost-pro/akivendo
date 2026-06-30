import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const tiendaId = searchParams.get("tienda_id");
  let q = supabase.from("productos").select("*").eq("activo", true).order("nombre");
  if (tiendaId) q = q.eq("tienda_id", tiendaId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data);
}