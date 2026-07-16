import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── In-memory rate limiter (Edge Runtime compatible) ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_REQUESTS) return true;
  entry.count++;
  return false;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit auth and API routes
  const isRateLimitedRoute =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/hospital-login";

  if (isRateLimitedRoute) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    if (isRateLimited(ip)) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "60", "Content-Type": "text/plain" },
      });
    }
  }

  // Skip for static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars missing, block everything except /login
  if (!supabaseUrl || !supabaseKey) {
    if (!pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // ─── Supabase session refresh ─────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthPage =
      pathname.startsWith("/login") || pathname.startsWith("/hospital-login");

    if (!user && !isAuthPage) {
      const url = request.nextUrl.clone();
      // Redirect hospital-portal visitors to the hospital login page
      url.pathname = pathname.startsWith("/hospital-portal")
        ? "/hospital-login"
        : "/login";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } catch {
    // If Supabase call fails, redirect to login rather than crashing
    if (!pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
