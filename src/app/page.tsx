import { Activity, Database, MapPin, Shield, Users } from "lucide-react";

export default function HomePage() {
  const systemCards = [
    {
      title: "Territory Management",
      description: "Inspect polygon boundaries, verify territory claims, and resolve conflicts.",
      icon: MapPin,
      status: "Ready",
    },
    {
      title: "User Administration",
      description: "Manage trainer profiles, privileges, and audit active sessions.",
      icon: Users,
      status: "Configured",
    },
    {
      title: "Database Sync",
      description: "Direct connection to Firestore collections and future API routing.",
      icon: Database,
      status: "Active",
    },
    {
      title: "System Audit & Security",
      description: "Review administrative actions, role enforcement, and token integrity.",
      icon: Shield,
      status: "Protected",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 font-semibold text-white">
              PI
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Poke-Iring Admin</h1>
              <p className="text-xs text-neutral-400">Operations & Management Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
              <Activity className="h-3 w-3" />
              Environment: Initializing
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 p-6">
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6">
          <h2 className="text-lg font-semibold tracking-tight">System Baseline</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Next.js App Router workspace initialized with Firebase Client and Admin integration templates.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {systemCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 transition-colors hover:border-neutral-700"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-800/50 text-neutral-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md border border-neutral-800 bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                      {card.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">{card.title}</h3>
                  <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-neutral-900 px-6 py-4 text-center text-xs text-neutral-500">
        Poke-Iring Admin Portal &middot; Confidential Internal Operations
      </footer>
    </div>
  );
}
