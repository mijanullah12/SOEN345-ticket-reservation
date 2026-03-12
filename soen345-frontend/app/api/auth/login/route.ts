import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { LoginResponse } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const loginData = data as LoginResponse;

    const cookieStore = await cookies();
    cookieStore.set("auth_token", loginData.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: loginData.expiresIn,
      path: "/",
    });

    return NextResponse.json({ user: loginData.user });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
