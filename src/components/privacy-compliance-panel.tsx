import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Shield, Lock, EyeOff, Server, Brain, FileCheck } from "lucide-react";

export function PrivacyCompliancePanel() {
  const [calendarEnabled, setCalendarEnabled] = useState(true);
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [githubEnabled, setGithubEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Architecture Diagram */}
      <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl">
        <div className="absolute inset-1.5 rounded-lg border border-white/5 pointer-events-none" />
        <div className="mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-sky-400" />
          <h3 className="font-display text-lg font-semibold text-white">
            Privacy Architecture
          </h3>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
            <FileCheck className="h-3 w-3" /> SOC 2 Ready
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl py-4">
          {/* Data Flow Diagram */}
          <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-3">
            {/* Source Box */}
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sky-300">
                Raw Data Sources
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
                  Slack messages
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Calendar events
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
                  GitHub activity
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center text-white/40 md:w-10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="hidden md:block">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="block md:hidden rotate-90">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                Ingest
              </span>
            </div>

            {/* Local Parser */}
            <div className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 backdrop-blur-sm ring-1 ring-emerald-500/10">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-300">
                Local Context Parser
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Brain className="h-4 w-4 text-emerald-400" />
                  On-device WebAssembly
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <EyeOff className="h-4 w-4 text-emerald-400" />
                  Client sandbox
                </div>
                <div className="mt-2 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-500/20">
                  Private content never leaves browser
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center text-white/40 md:w-10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="hidden md:block">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="block md:hidden rotate-90">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                Anonymize
              </span>
            </div>

            {/* Aggregated Metrics */}
            <div className="flex-1 rounded-xl border border-sky-500/30 bg-sky-950/30 p-4 backdrop-blur-sm ring-1 ring-sky-500/10">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sky-300">
                Anonymized Metrics
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">
                  <span>Sentiment</span>
                  <span className="font-medium text-emerald-300">STABLE</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">
                  <span>Response time</span>
                  <span className="font-medium text-sky-300">24m</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">
                  <span>Focus blocks</span>
                  <span className="font-medium text-amber-300">2.3 hrs</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center text-white/40 md:w-10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="hidden md:block">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="block md:hidden rotate-90">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                Sync
              </span>
            </div>

            {/* Cloud DB */}
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-300">
                Cloud Database
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  Encrypted at rest
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Row-level security
                </div>
                <div className="mt-2 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-500/20">
                  Only aggregates stored — zero raw text
                </div>
              </div>
            </div>
          </div>

          {/* Anonymization Border Label */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm ring-1 ring-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Anonymization Border — Raw text permanently discarded here
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Guarantee Checklist */}
      <Card className="border border-border/60 p-6 shadow-lg bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          <h3 className="font-display text-lg font-semibold">Privacy Guarantee</h3>
        </div>

        <div className="space-y-4">
          {/* Guarantee Items */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 transition-all hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <EyeOff className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                No Message Body Storage
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                Raw text is never saved or uploaded to any database.
              </p>
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/5" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-sky-200 bg-sky-50/50 p-4 transition-all hover:border-sky-300 hover:shadow-md dark:border-sky-900/40 dark:bg-sky-950/20">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Lock className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                Anonymized Metrics Only
              </p>
              <p className="mt-1 text-xs text-sky-700/80 dark:text-sky-400/80">
                Only aggregate sentiment and response time metrics are synced.
              </p>
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-sky-500/5" />
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-violet-200 bg-violet-50/50 p-4 transition-all hover:border-violet-300 hover:shadow-md dark:border-violet-900/40 dark:bg-violet-950/20">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Brain className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                On-Device Processing
              </p>
              <p className="mt-1 text-xs text-violet-700/80 dark:text-violet-400/80">
                All NLP and parsing runs locally via WebAssembly.
              </p>
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-violet-500/5" />
            </div>
          </div>

          {/* Granular Consent Toggles */}
          <div className="rounded-xl border border-border/60 bg-white/60 p-4 dark:bg-slate-900/40">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Granular Developer Consent
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium">Calendar Tracking</p>
                    <p className="text-xs text-muted-foreground">Meeting density & focus block analysis</p>
                  </div>
                </div>
                <Switch checked={calendarEnabled} onCheckedChange={setCalendarEnabled} />
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.659 8.25-8.25 8.25S4.5 16.556 4.5 12 8.159 3.75 12.75 3.75 21 7.444 21 12z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium">Slack Tracking</p>
                    <p className="text-xs text-muted-foreground">Interruption rate & response time metrics</p>
                  </div>
                </div>
                <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium">GitHub Tracking</p>
                    <p className="text-xs text-muted-foreground">PR velocity & commit pattern analysis</p>
                  </div>
                </div>
                <Switch checked={githubEnabled} onCheckedChange={setGithubEnabled} />
              </div>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Shield className="h-3 w-3 text-emerald-600" />
              GDPR Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Lock className="h-3 w-3 text-sky-600" />
              End-to-End Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <EyeOff className="h-3 w-3 text-violet-600" />
              Zero-Knowledge Processing
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
