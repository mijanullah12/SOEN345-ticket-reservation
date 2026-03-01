import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-container">
      <div className="home-card">
        <h1 className="home-title">Ticket Reservation</h1>
        <p className="home-subtitle">
          Book and manage your event tickets in one place.
        </p>
        <div className="home-actions">
          <Link href="/login" className="home-btn home-btn-primary">
            Sign In
          </Link>
          <Link href="/register" className="home-btn home-btn-secondary">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
