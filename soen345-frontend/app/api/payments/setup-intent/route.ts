import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}

export async function POST() {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/payments/setup-intent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        data ?? { message: "Failed to create setup intent." },
        { status: res.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unexpected failure creating setup intent.";
    return NextResponse.json(
      { message: `Could not create setup intent. ${errorMessage}` },
      { status: 502 },
    );
  }
}
