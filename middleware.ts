import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // TEMPORAIREMENT DÉSACTIVÉ - Les routes API gérent l'auth elles-mêmes
  console.log("[MIDDLEWARE] Route:", request.nextUrl.pathname);

  // Laisser passer toutes les requêtes pour l'instant
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/dj/:path*"],
};
