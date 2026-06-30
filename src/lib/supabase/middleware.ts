import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let res = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(c: { name: string; value: string; options?: CookieOptions }[]) {
          c.forEach(({name,value}) => request.cookies.set(name,value));
          res = NextResponse.next({ request });
          c.forEach(({name,value,options}) => res.cookies.set(name,value,options));
        }
    }}
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const protegidas = ["/admin","/comprador","/vendedor"];
  const esProtegida = protegidas.some(p => pathname.startsWith(p));
  if (esProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/comprador/mapa";
    return NextResponse.redirect(url);
  }
  return res;
}
