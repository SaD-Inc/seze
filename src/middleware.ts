import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0];

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
