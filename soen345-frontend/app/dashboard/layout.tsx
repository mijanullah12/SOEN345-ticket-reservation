export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-app-shell="dashboard" className="dash-root">
      {children}
    </div>
  );
}
