import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Activity, Bell, Brain, LogOut, Settings, Sparkles, Users, Waves } from "lucide-react";
import type { ReactNode } from "react";

import { RealtimeListener } from "@/components/realtime-listener";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Brain },
  { to: "/interventions", label: "Interventions", icon: Sparkles },
  { to: "/team", label: "Team", icon: Users },
  { to: "/sprint-simulator", label: "Sprint Simulator", icon: Waves },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <RealtimeListener />
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4 lg:flex">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight">CL Balancer</p>
            <p className="text-xs text-muted-foreground">Cognitive telemetry</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-semibold">CL Balancer</span>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-sm text-muted-foreground">
            <span>Real-time cognitive load monitoring</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            {NAV.map(({ to, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "rounded-md p-2",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
