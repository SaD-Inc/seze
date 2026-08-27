import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0];

  // Some Android link checkers still request the legacy PNG filename. Keep
  // those requests on the canonical icon rather than producing noisy 404s.
  if (request.nextUrl.pathname === "/favicon.png") {
    return NextResponse.rewrite(new URL("/icon.svg", request.url));
  }

  if (hostname === "www.playseze.com") {
    const canonical = request.nextUrl.clone();
    canonical.protocol = "https";
    canonical.hostname = "playseze.com";
    canonical.port = "";
    return NextResponse.redirect(canonical, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
