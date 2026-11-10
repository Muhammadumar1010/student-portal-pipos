import { requireUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-brand-card">
      <Navbar user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
