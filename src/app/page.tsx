import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: perfil } = await supabase.from("usuarios").select("rol").eq("id", user.id).single();
    if (perfil?.rol === "admin")    redirect("/admin/metricas");
    if (perfil?.rol === "vendedor") redirect("/vendedor/perfil");
    redirect("/comprador/mapa");
  }
  redirect("/landing");
}
