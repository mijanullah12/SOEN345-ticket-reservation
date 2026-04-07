export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: FieldError[];
}

/** Mirrors backend `EventResponse` (ISO-8601 strings for instants). */
export interface Event {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  location: string;
  capacity: number;
  ticketPrice: number;
  organizerId?: string | null;
  status: "ACTIVE" | "CANCELLED";
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface EventWritePayload {
  name: string;
  description?: string;
  date: string;
  location: string;
  capacity: number;
  ticketPrice: number;
}
