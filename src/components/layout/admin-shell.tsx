"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Calendar,
  Database,
  LayoutDashboard,
  MapPin,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Game Events",
    href: "/events",
    icon: Calendar,
  },
  {
    name: "Database & Dry Run",
    href: "/database",
    icon: Database,
  },
  {
    name: "Remote Config",
    href: "/config",
    icon: Settings,
  },
  {
    name: "Territories",
    href: "/territories",
    icon: MapPin,
  },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900/50 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-800/80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF8C1A] font-bold text-white tracking-wider shadow-xs">
              PI
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Poke: Iring</div>
              <div className="text-xs text-neutral-400">Calico Operations</div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#FF8C1A]/15 text-[#FF8C1A] border border-[#FF8C1A]/30 font-semibold"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System badge footer */}
        <div className="p-4 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Portal Live
            </span>
            <span className="font-mono text-neutral-500">v1.1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-900/40 px-6 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Client Platform</span>
            <span>&rsaquo;</span>
            <span className="text-neutral-200 font-medium">
              Flutter Mobile &amp; Web (Calico Theme)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
              <Activity className="h-3 w-3 text-emerald-400" />
              Connected to Cloud Firestore
            </span>
          </div>
        </header>

        {/* Dynamic page body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
