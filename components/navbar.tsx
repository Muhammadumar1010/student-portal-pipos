import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { User } from "@/db/schema";
import { ThemeToggle } from "./theme-toggle";

interface NavbarProps {
  user: User;
}

export function Navbar({ user }: NavbarProps) {
  const roleBadgeColor =
    {
      admin:
        "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      supervisor:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      student:
        "bg-brand-success-bg text-brand-success border-brand-success-border",
    }[user.role as "admin" | "supervisor" | "student"] ||
    "bg-brand-subtle text-brand-text-secondary border-brand-border-default";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border-default bg-brand-page/95 backdrop-blur supports-[backdrop-filter]:bg-brand-page/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/app" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-accent shadow-sm overflow-hidden">
              <img
                src="/Images/LOGO.png"
                alt="P&O"
                className="h-full w-full object-fit"
              />
            </div>
          </Link>
          <span className="hidden text-xs font-medium text-brand-text-muted sm:inline-block border-l border-brand-border-default">
            PIPOS Clinical Management
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-brand-text-primary leading-tight">
              {user.fullName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border capitalize ${roleBadgeColor}`}
              >
                {user.role}
              </span>
            </div>
          </div>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 ring-2 ring-brand-border-default",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
