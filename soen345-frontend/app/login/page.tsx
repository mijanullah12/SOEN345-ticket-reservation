import { LoginForm } from "@/app/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const redirect = params?.redirect || "/dashboard";

  return (
    <main className="auth-container">
      <LoginForm redirect={redirect} />
    </main>
  );
}
