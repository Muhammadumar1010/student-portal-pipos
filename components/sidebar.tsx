"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/db/schema";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck,
  PlusCircle,
  Settings,
  Database,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const linksByRole: Record<
    UserRole,
    {
      href: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }[]
  > = {
    admin: [
      { href: "/app/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/admin/users", label: "Users & Accounts", icon: Users },
      {
        href: "/app/admin/cases",
        label: "All Clinical Cases",
        icon: FolderKanban,
      },
      { href: "/app/admin/settings", label: "System Settings", icon: Settings },
      { href: "/app/admin/backup", label: "Backup & Exports", icon: Database },
    ],
    supervisor: [
      { href: "/app/supervisor", label: "Dashboard", icon: LayoutDashboard },
      {
        href: "/app/supervisor/queue",
        label: "Approval Queue",
        icon: FileCheck,
      },
      {
        href: "/app/supervisor/cases",
        label: "My Clinical Cases",
        icon: FolderKanban,
      },
      {
        href: "/app/supervisor/cases/assign",
        label: "Assign New Case",
        icon: PlusCircle,
      },
      {
        href: "/app/supervisor/students",
        label: "Students Directory",
        icon: GraduationCap,
      },
    ],
    student: [
      { href: "/app/student", label: "Dashboard", icon: LayoutDashboard },
      {
        href: "/app/student/cases/new",
        label: "New Patient Case",
        icon: PlusCircle,
      },
      {
        href: "/app/student/cases",
        label: "My Clinical Cases",
        icon: ClipboardList,
      },
    ],
  };

  const navItems = linksByRole[role] || [];

  return (
    <aside className="w-64 shrink-0 border-r border-brand-border-default bg-brand-page flex flex-col justify-between py-6 px-4">
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== `/app/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-accent/10 text-brand-accent font-semibold"
                  : "text-brand-text-secondary hover:bg-brand-subtle"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? "text-brand-accent" : "text-brand-text-muted"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-lg border border-brand-border-default bg-brand-card p-3 text-xs text-brand-text-muted">
        <p className="font-semibold text-brand-text-secondary">
          PIPOS CaseFlow
        </p>
        <p className="mt-0.5 text-[11px]">
          Prosthetic & Orthotic Clinical Management
        </p>
      </div>
    </aside>
  );
}
