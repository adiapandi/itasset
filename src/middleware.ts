import { withAuth } from "next-auth/middleware";

/**
 * Edge-level gate: any route under the protected matcher below requires
 * a valid session. Fine-grained (per-permission) checks happen inside
 * each page/API route via withPermission / hasPermission — this layer
 * only answers "is someone logged in at all".
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/admin/:path*"],
};
