import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppRootPage() {
  const user = await requireUser();

  switch (user.role) {
    case "admin":
      redirect("/app/admin");
    case "supervisor":
      redirect("/app/supervisor");
    case "student":
      redirect("/app/student");
    default:
      redirect("/sign-in");
  }
}
