import { Link, useRouter } from "@tanstack/react-router";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function classifyError(message: string): {
  title: string;
  description: string;
  toast: string;
} {
  const m = message.toLowerCase();
  if (m.includes("profile not found") || m.includes("profile")) {
    return {
      title: "We couldn't load your profile",
      description:
        "Your account exists but we couldn't find your profile yet. Try refreshing — if it keeps happening, sign out and back in.",
      toast: "Profile lookup failed. Try refreshing.",
    };
  }
  if (m.includes("unauthorized") || m.includes("401") || m.includes("no authorization")) {
    return {
      title: "Your session expired",
      description: "Please sign in again to continue.",
      toast: "Session expired — please sign in again.",
    };
  }
  if (m.includes("network") || m.includes("fetch")) {
    return {
      title: "Network problem",
      description: "We couldn't reach the server. Check your connection and try again.",
      toast: "Network problem — couldn't reach the server.",
    };
  }
  return {
    title: "Something went wrong",
    description: message || "An unexpected error happened while loading this page.",
    toast: "Something went wrong loading this page.",
  };
}

export function RouteErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();
  const info = classifyError(error?.message ?? "");

  useEffect(() => {
    console.error("Route error:", error);
    toast.error(info.toast);
    queryReset.reset();
  }, [error, info.toast, queryReset]);

  const retry = () => {
    queryReset.reset();
    router.invalidate();
    reset();
  };

  const isAuth = info.title === "Your session expired";

  return (
    <div className="mx-auto flex max-w-xl items-center justify-center py-16">
      <Card className="w-full p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-semibold">{info.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{info.description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={retry}>
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
          {isAuth ? (
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
