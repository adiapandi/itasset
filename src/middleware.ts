import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/assets/:path*",
    "/locations/:path*",
    "/transfers/:path*",
    "/maintenance/:path*",
    "/audits/:path*",
    "/reports/:path*",
    "/notifications/:path*",
  ],
};
