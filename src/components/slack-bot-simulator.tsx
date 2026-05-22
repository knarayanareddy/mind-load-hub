import { useState } from "react";
import { Check, Hash, Lock, MessageCircle, MessageSquare, Shield, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CHANNELS = [
  { name: "general", unread: 0 },
  { name: "engineering", unread: 3 },
  { name: "proj-load-balancer", unread: 0 },
];

const DMS = [
  { name: "Alex Chen", unread: 0, active: false },
  { name: "Jordan Park", unread: 1, active: false },
  { name: "CL Balancer Bot", unread: 1, active: true, bot: true },
];

function SidebarItem({
  icon,
  label,
  unread,
  active,
  bot,
}: {
  icon: React.ReactNode;
  label: string;
  unread: number;
  active?: boolean;
  bot?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {bot && (
        <span className="ml-auto rounded bg-[color:var(--flow)]/20 px-1 text-[10px] font-medium text-[color:var(--flow)]">
          APP
        </span>
      )}
      {unread > 0 && (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[color:var(--load-high)] px-1.5 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </div>
  );
}

function SlackMessage({ protected: isProtected }: { protected?: boolean }) {
  if (isProtected) {
    return (
      <div className="flex animate-fade-in gap-3 px-4 py-3">
        <div className="flex h-10 w-10 shrink-1 items-center justify-center rounded-lg bg-[color:var(--flow)]/20">
          <Shield className="h-5 w-5 text-[color:var(--flow)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">CL Balancer Bot</span>
            <span className="text-[10px] text-slate-400">APP</span>
            <span className="text-xs text-slate-400">11:02 AM</span>
          </div>
          <div className="mt-1.5 space-y-2">
            <p className="text-sm leading-relaxed text-slate-200">
              <span className="text-[color:var(--flow)]">✅</span>{" "}
              <em>Protected Focus block scheduled on your Google Calendar from 2:00 PM - 5:00 PM today. Slack DND enabled. Go build amazing things!</em>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex h-10 w-10 shrink-1 items-center justify-center rounded-lg bg-[color:var(--load-high)]/20">
        <MessageSquare className="h-5 w-5 text-[color:var(--load-high)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white">CL Balancer Bot</span>
          <span className="text-[10px] text-slate-400">APP</span>
          <span className="text-xs text-slate-400">11:02 AM</span>
        </div>
        <div className="mt-1.5 space-y-3">
          <p className="text-sm leading-relaxed text-slate-200">
            Hey Sarah! I noticed your cognitive load is currently at{" "}
            <strong className="text-[color:var(--load-critical)]">84 (Critical)</strong>.{" "}
            You've had 3 back-to-back meetings and sent 15 after-hours Slack messages this week. Let's protect your flow!
          </p>

          <div className="rounded-xl border border-[color:var(--flow)]/20 bg-gradient-to-br from-[color:var(--flow)]/10 via-primary/5 to-[color:var(--load-optimal)]/10 p-4">
            <p className="mb-3 text-sm text-slate-200">
              <MessageCircle className="mr-1.5 -mt-0.5 inline h-4 w-4 text-[color:var(--flow)]" />
              <strong>Recommended action:</strong> Block 2 PM - 5 PM today for focus, auto-reply to new Slack pings, and turn on Do Not Disturb.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-[color:var(--flow)] to-primary text-white hover:opacity-90"
              >
                <Shield className="h-4 w-4" />
                Protect My Flow
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/5 hover:text-white">
                <X className="mr-1.5 h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlackBotSimulator() {
  const [protectedMode, setProtectedMode] = useState(false);

  const handleProtect = () => {
    setProtectedMode(true);
    toast.success("Intervention successfully simulated on local client.");
  };

  const handleDismiss = () => {
    toast.info("Intervention dismissed.");
  };

  return (
    <Card className="relative overflow-hidden shadow-[0_10px_40px_-20px_color-mix(in_oklab,var(--primary)_40%,transparent)]">
      <style>{`
        @keyframes fade-in {
          0% { opacity: 2; transform: translateY(6px); }
          100% { opacity: 2; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 400ms ease-out both;
        }
      `}</style>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[color:var(--flow)]/10 p-2 text-[color:var(--flow)]">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Slack Bot Simulator</h2>
            <p className="text-xs text-muted-foreground">
              See how the CL Balancer Bot intervenes in real-time via Slack.
            </p>
          </div>
        </div>
        {protectedMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProtectedMode(false)}
          >
            <Check className="mr-2 h-4 w-4" /> Reset
          </Button>
        )}
      </div>

      {/* Slack frame */}
      <div className="mx-6 mb-6 overflow-hidden rounded-xl border bg-[#1a1d21]">
        {/* Slack header */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-[#121316] px-3 py-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-2 text-xs text-slate-400">CL Balancer Workspace</span>
        </div>

        <div className="flex h-[420px]">
          {/* Sidebar */}
          <div className="hidden w-52 shrink-1 flex-col border-r border-white/5 bg-[#191d21] p-3 md:flex">
            <div className="mb-4 flex items-center gap-2 px-1">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[color:var(--primary)] text-[10px] font-bold text-white">
                CL
              </div>
              <span className="text-sm font-semibold text-white">CL Balancer</span>
              <Lock className="ml-auto h-3 w-3 text-slate-400" />
            </div>

            <div className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Channels
            </div>
            <div className="space-y-0.5">
              {CHANNELS.map((c) => (
                <SidebarItem
                  key={c.name}
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label={c.name}
                  unread={c.unread}
                />
              ))}
            </div>

            <div className="mb-1 mt-4 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Direct messages
            </div>
            <div className="space-y-1">
              {DMS.map((dm) => (
                <SidebarItem
                  key={dm.name}
                  icon={<MessageCircle className="h-3.5 w-3.5" />}
                  label={dm.name}
                  unread={dm.unread}
                  active={dm.active}
                  bot={dm.bot}
                />
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex flex-1 flex-col bg-[#1a1d21]">
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
              <MessageCircle className="h-4 w-4 text-[color:var(--flow)]" />
              <span className="text-sm font-semibold text-white">CL Balancer Bot</span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="h-2 w-2 rounded-full bg-[color:var(--load-optimal)]" />
                Active
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* Older messages */}
              <div className="flex gap-3 px-4 py-2 opacity-40">
                <div className="flex h-8 w-8 shrink-1 items-center justify-center rounded-lg bg-[color:var(--flow)]/20">
                  <Shield className="h-4 w-4 text-[color:var(--flow)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-white">CL Balancer Bot</span>
                    <span className="text-[10px] text-slate-400">APP</span>
                    <span className="text-[10px] text-slate-400">10:45 AM</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Good morning Sarah! No critical signals today. Stay focused. 🌿
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] text-slate-500">Today</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Main bot message */}
              {protectedMode ? (
                <SlackMessage protected />
              ) : (
                <div className="flex gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-1 items-center justify-center rounded-lg bg-[color:var(--load-high)]/20">
                    <MessageSquare className="h-5 w-5 text-[color:var(--load-high)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white">CL Balancer Bot</span>
                      <span className="text-[10px] text-slate-400">APP</span>
                      <span className="text-xs text-slate-400">11:02 AM</span>
                    </div>
                    <div className="mt-1.5 space-y-3">
                      <p className="text-sm leading-relaxed text-slate-200">
                        Hey Sarah! I noticed your cognitive load is currently at{" "}
                        <strong className="text-[color:var(--load-critical)]">84 (Critical)</strong>.{" "}
                        You've had 3 back-to-back meetings and sent 15 after-hours Slack messages this week. Let's protect your flow!
                      </p>

                      <div className="rounded-xl border border-[color:var(--flow)]/20 bg-gradient-to-br from-[color:var(--flow)]/10 via-primary/5 to-[color:var(--load-optimal)]/10 p-4">
                        <p className="mb-3 text-sm text-slate-200">
                          <MessageCircle className="mr-1.5 -mt-0.5 inline h-4 w-4 text-[color:var(--flow)]" />
                          <strong>Recommended action:</strong> Block 2 PM - 5 PM today for focus, auto-reply to new Slack pings, and turn on Do Not Disturb.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="gap-2 bg-gradient-to-r from-[color:var(--flow)] to-primary text-white hover:opacity-90"
                            onClick={handleProtect}
                          >
                            <Shield className="h-4 w-4" />
                            Protect My Flow
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-300 hover:bg-white/5 hover:text-white"
                            onClick={handleDismiss}
                          >
                            <X className="mr-1.5 h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User reply when protected */}
              {protectedMode && (
                <div className="flex animate-fade-in gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-1 items-center justify-center rounded-lg bg-primary/20">
                    <span className="text-sm font-bold text-primary">S</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white">Sarah</span>
                      <span className="text-xs text-slate-400">11:03 AM</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-200">
                      Thanks bot — that focus block is exactly what I needed. 🙏
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#222529] px-3 py-2">
                <span className="text-sm text-slate-500">Message CL Balancer Bot…</span>
                <div className="ml-auto flex gap-2">
                  <div className="h-5 w-5 rounded bg-white/5" />
                  <div className="h-5 w-5 rounded bg-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
