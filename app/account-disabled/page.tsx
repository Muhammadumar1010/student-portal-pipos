import { SignOutButton } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";

export default function AccountDisabledPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account Inactive or Disabled
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Your account needs to be verified by the PIPOS administrator.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          If you believe this is an error or need your account activated, please contact your department coordinator or PIPOS IT administration.
        </p>
        <div className="mt-6">
          <SignOutButton>
            <button className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors shadow-sm">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
