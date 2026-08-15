import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/api/auth", "/events", "/api/events", "/sertifikat", "/kebijakan-privasi", "/syarat-ketentuan"];
const ROLE_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN: ["/admin", "/guru", "/siswa", "/orangtua", "/afiliator"],
  ADMIN: ["/admin", "/guru", "/siswa", "/orangtua", "/afiliator"],
  ADMIN_CABANG: ["/admin", "/guru", "/siswa", "/orangtua"],
  ADMIN_KEUANGAN: ["/admin", "/guru", "/siswa", "/orangtua"],
  ADMIN_AKADEMIK: ["/admin", "/guru", "/siswa", "/orangtua"],
  GURU: ["/guru"],
  SISWA: ["/siswa"],
  ORANG_TUA: ["/orangtua"],
  AFILIATOR: ["/afiliator"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (isPublicRoute) return NextResponse.next();

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth.user?.role as string;
  const allowedPaths = ROLE_ROUTES[role] ?? [];
  const isAllowed =
    pathname === "/" ||
    pathname.startsWith("/api") ||
    allowedPaths.some((path) => pathname.startsWith(path));

  if (!isAllowed) {
    const redirectMap: Record<string, string> = {
      SUPER_ADMIN: "/admin",
      ADMIN: "/admin",
      ADMIN_CABANG: "/admin",
      ADMIN_KEUANGAN: "/admin",
      ADMIN_AKADEMIK: "/admin",
      GURU: "/guru",
      SISWA: "/siswa",
      ORANG_TUA: "/orangtua",
      AFILIATOR: "/afiliator",
    };
    return NextResponse.redirect(new URL(redirectMap[role] ?? "/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
