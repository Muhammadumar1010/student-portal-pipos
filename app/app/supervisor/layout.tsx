import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(['supervisor']);

  return (
    <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
      <Sidebar role="supervisor" />
      <main className="flex-1 bg-brand-card p-4 sm:p-4 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
