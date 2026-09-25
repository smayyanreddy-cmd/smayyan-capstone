import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname, origin } = req.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");

  if (!isLoggedIn && !isLoginPage && !isAuthApi) {
    return NextResponse.redirect(new URL("/login", origin));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
