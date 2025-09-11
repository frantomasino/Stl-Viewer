import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const iss = process.env.SESSION_ISS!;
const aud = process.env.SESSION_AUD!;
const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

// Definí qué rutas requieren roles
function needsRoles(pathname: string): string[] | null {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/pro")) return ["pro", "admin"];
  return null; // público
}

// 👇 Esta función es obligatoria
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allowed = needsRoles(pathname);

  // si la ruta no necesita rol, seguir normal
  if (!allowed) return NextResponse.next();

  const tok = req.cookies.get("app_session")?.value;
  if (!tok) return NextResponse.redirect(new URL("/admin", req.url));

  try {
    const { payload } = await jose.jwtVerify(tok, secret, { issuer: iss, audience: aud });
    const role = (payload as any).role as string;
    if (!allowed.includes(role)) {
      return NextResponse.redirect(new URL("/403", req.url));
    }
    return NextResponse.next();
  } catch (e) {
    console.error("middleware error", e);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

// 👇 Config para que Next sepa qué rutas pasan por el middleware
export const config = {
  matcher: ["/admin/:path*", "/pro/:path*"],
};
