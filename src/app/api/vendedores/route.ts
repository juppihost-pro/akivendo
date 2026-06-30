import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tiendas").select("*, vendedor:usuarios(nombre,email), categoria:categorias_vendedor(id,nombre,emoji)").eq("activa", true).order("ultima_ubicacion", { ascending:false });
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data);
}