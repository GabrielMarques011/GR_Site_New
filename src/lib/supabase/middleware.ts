import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { supabasePublishableKey, supabaseUrl } from "./env";

const PROTECTED_PREFIX = "/administracao";
const LOGIN_PATH = "/administracao/login";

/**
 * Atualiza a sessão Supabase em cada requisição e protege as rotas do
 * painel administrativo. A verificação de ROLE (admin de verdade) acontece
 * depois, no servidor (layout do painel) e nas políticas de RLS — este
 * middleware só garante que exista uma sessão válida antes de liberar a
 * rota, evitando round-trips desnecessários para visitantes anônimos.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname.startsWith(PROTECTED_PREFIX) && pathname !== LOGIN_PATH;

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === LOGIN_PATH && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = PROTECTED_PREFIX;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
