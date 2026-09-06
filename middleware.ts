import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;

    if (pathname.startsWith("/admin") && role !== "agency_admin") {
      const target = role === "client_user" ? "/client/dashboard" : "/login";
      return NextResponse.redirect(new URL(target, req.url));
    }

    if (pathname.startsWith("/client") && role !== "client_user") {
      const target = role === "agency_admin" ? "/admin/dashboard" : "/login";
      return NextResponse.redirect(new URL(target, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
