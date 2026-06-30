import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MapaCompradorView from "@/components/comprador/MapaCompradorView";
export default async function MapaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: perfil } = await supabase.from("usuarios").select("*").eq("id", user.id).single();
  if (!perfil) redirect("/login");
  return <MapaCompradorView usuario={perfil} />;
}