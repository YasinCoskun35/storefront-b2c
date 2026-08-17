import { NextRequest, NextResponse } from "next/server";
import { authApi } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = true } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Call backend API
    const response = await authApi.login(email, password);

    // Create response with HttpOnly cookie
    const nextResponse = NextResponse.json(response);

    // Set HttpOnly cookie for refresh token. "Remember me" controls whether it
    // survives after the browser closes (persistent) or not (session cookie).
    if (response.refreshToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 } : {}), // 7 days if remembered
      };

      nextResponse.cookies.set("refreshToken", response.refreshToken, cookieOptions);
      nextResponse.cookies.set("rememberMe", rememberMe ? "1" : "0", cookieOptions);
    }

    return nextResponse;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.message || "Login failed",
      },
      { status: error.response?.status || 500 }
    );
  }
}

