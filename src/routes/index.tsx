import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { Activity, ArrowRight, Brain, Calendar, GitPullRequest, MessageSquare, Shield, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cognitive Load Balancer — protect developer flow" },
      {
        name: "description",
        content:
          "Real-time cognitive load monitoring and AI-driven micro-interventions for engineering teams. Prevent burnout, protect focus.",
      },
      { property: "og:title", content: "Cognitive Load Balancer" },
      {
        property: "og:description",
        content: "Protect developer flow, prevent burnout — automatically.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold">CL Balancer</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,_var(--primary)_15%,_transparent),_transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-driven micro-interventions for engineering teams
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Protect developer flow.
            <br />
            <span className="text-primary">Prevent burnout.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Cognitive Load Balancer reads calendar, Slack, GitHub, and Jira signals to
            measure real-time cognitive load — then triggers focus blocks, DND, and
            meeting buffers before your team hits the wall.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/login">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required • Seed 14 days of demo data in one click
          </p>
        </div>
      </section>

      {/* Signals */}
      <section id="how" className="border-t border-border bg-surface/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold">Five signals, one score</h2>
            <p className="mt-3 text-muted-foreground">
              Privacy-preserving telemetry from the tools your team already uses.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Calendar density",
                copy: "Meeting load, back-to-back chains, after-hours invites, focus gaps.",
              },
              {
                icon: MessageSquare,
                title: "Comms patterns",
                copy: "Response latency, after-hours pings, sentiment trend in messages.",
              },
              {
                icon: GitPullRequest,
                title: "Task switching",
                copy: "Parallel PRs in flight, ticket reassignments, work-in-progress.",
              },
              {
                icon: Shield,
                title: "Boundary signals",
                copy: "Days without a real break, late-night activity, vacation gaps.",
              },
              {
                icon: Brain,
                title: "Sentiment",
                copy: "Aggregated tone from communication — never individual messages.",
              },
              {
                icon: Zap,
                title: "Live interventions",
                copy: "AI-proposed focus blocks, DND windows, and PR review pauses.",
              },
            ].map(({ icon: Icon, title, copy }) => (
              <Card key={title} className="p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              { n: "01", t: "Connect", d: "Wire Slack, GitHub, Jira, and Calendar via webhook ingestors." },
              { n: "02", t: "Measure", d: "A weighted 0–100 score is computed across five dimensions every time a signal lands." },
              { n: "03", t: "Intervene", d: "Lovable AI proposes empathetic, contextual actions — apply or dismiss in one tap." },
            ].map((s) => (
              <div key={s.n}>
                <p className="font-display text-sm font-semibold text-primary">{s.n}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-surface/40 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="font-display text-3xl font-semibold">Ship without burning out</h2>
          <p className="mt-3 text-muted-foreground">
            Spin up a dashboard in under a minute. Seed demo data to explore the full experience.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/login">
              Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built on Lovable Cloud • Cognitive Load Balancer
      </footer>
    </div>
  );
}
