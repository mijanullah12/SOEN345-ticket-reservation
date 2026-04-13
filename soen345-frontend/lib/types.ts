export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  preferredNotificationChannel?: NotificationChannel;
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
  category?: string | null;
  organizerId?: string | null;
  organizerPayoutReady?: boolean | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
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
  category?: string;
}

export type NotificationChannel = "EMAIL" | "SMS";

export interface Reservation {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventTicketPrice: number;
  quantity?: number | null;
  status: "ACTIVE" | "CANCELLED";
  reservedAt: string;
  cancelledAt?: string | null;
  updatedAt?: string | null;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  status?: string;
  preferredNotificationChannel?: NotificationChannel;
  paymentInfo?: {
    customerId?: string | null;
    defaultPaymentMethodId?: string | null;
    payoutAccountId?: string | null;
    payoutEmail?: string | null;
    payoutDisplayName?: string | null;
  } | null;
}
