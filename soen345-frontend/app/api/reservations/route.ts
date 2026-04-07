import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return unauthorized();

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/reservations`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return unauthorized();

    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/api/v1/reservations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
