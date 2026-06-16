import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readAuthRuntimeConfig } from "../config";

export function createSupabaseServerClient() {
  const config = readAuthRuntimeConfig();

  if (config.status === "disabled") {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always set cookies. Route handlers own writes.
        }
      },
    },
  });
}

export function createSupabaseRouteHandlerClient(request: NextRequest, response: NextResponse) {
  const config = readAuthRuntimeConfig();

  if (config.status === "disabled") {
    return null;
  }

  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export function createAuthRedirectResponse(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}
