/** Single source for server-side backend origin (BFF routes use the same env). */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
