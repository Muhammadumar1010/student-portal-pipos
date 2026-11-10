import { requireUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser(['admin']);

  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );
}
