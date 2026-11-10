import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-brand-page">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-brand-border-default bg-brand-page/95 backdrop-blur supports-[backdrop-filter]:bg-brand-page/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-lg font-bold tracking-tight text-brand-text-primary">
                CaseFlow
              </span>
              <span className="ml-2 text-xs font-semibold text-brand-accent uppercase tracking-wider">
                PIPOS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle/>
            {userId ? (
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent/90 shadow-sm transition-colors"
              >
                Go to Portal <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center rounded-lg bg-brand-text-primary px-4 py-2 text-sm font-semibold text-brand-page hover:opacity-90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Title & Action Button */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-text-primary sm:text-6xl">
            CaseFlow
          </h1>
          <p className="mt-4 text-xl font-medium text-brand-text-muted">
            PIPOS Clinical Case Management System
          </p>

          <div className="mt-10 flex items-center justify-center">
            {userId ? (
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-brand-accent/90 transition-all"
              >
                Go to Portal <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-brand-accent/90 transition-all"
              >
                Sign In <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-brand-text-muted">
        © {new Date().getFullYear()} Pakistan Institute of Prosthetic & Orthotic Sciences (PIPOS)
      </footer>
    </div>
  );
}
