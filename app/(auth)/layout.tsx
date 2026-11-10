export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-brand-page to-brand-subtle">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
          CaseFlow
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          PIPOS Clinical Case Management System
        </p>
      </div>
      {children}
    </div>
  );
}
