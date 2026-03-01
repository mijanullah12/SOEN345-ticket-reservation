const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw {
      status: res.status,
      message: body?.message ?? res.statusText,
      fieldErrors: body?.fieldErrors ?? [],
    };
  }

  return res.json();
}
