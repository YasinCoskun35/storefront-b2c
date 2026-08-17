import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/api";

/**
 * Exchanges the HttpOnly refresh-token cookie for a fresh access token.
 * Called by the axios interceptor when a request comes back 401.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const rememberMe = request.cookies.get("rememberMe")?.value !== "0";

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const data = await authApi.refresh(refreshToken);

    const res = NextResponse.json({
      accessToken: data.accessToken,
      user: data.user,
    });

    // The backend rotates the refresh token, so persist the new one, keeping
    // the same "remember me" persistence the user chose at login.
    if (data.refreshToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}),
      };

      res.cookies.set("refreshToken", data.refreshToken, cookieOptions);
      res.cookies.set("rememberMe", rememberMe ? "1" : "0", cookieOptions);
    }

    return res;
  } catch {
    // Refresh token invalid/expired — clear it so the user is sent to login.
    const res = NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    res.cookies.delete("refreshToken");
    res.cookies.delete("rememberMe");
    return res;
  }
}
