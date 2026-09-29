"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

type ProviderStatus = {
  rateLimited: boolean;
  retryInSeconds: number;
  lastModel: string | null;
};

const POLL_MS = 10_000;

/**
 * Tells the operator whether the AI backend is usable right now. The free
 * OpenRouter tier rate-limits after a handful of calls, and during a demo the
 * difference between "the app is broken" and "wait 40 seconds" matters.
 */
export function ProviderBanner() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const response = await fetch("/api/provider-status", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as ProviderStatus;
        if (active) setStatus(next);
      } catch {
        // A status check failure is not worth surfacing.
      } finally {
        if (active) setChecked(true);
      }
    }

    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!checked || !status) return null;

  if (status.rateLimited) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p className="leading-5">
          <span className="font-semibold">Free AI tier is rate limited.</span> Requests are
          being rejected right now. Wait about {status.retryInSeconds}s, or continue manually
          where offered. Adding OpenRouter credits removes this limit.
        </p>
      </div>
    );
  }

  if (status.lastModel) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="leading-5">
          AI ready. Last call used <span className="font-medium text-foreground">{status.lastModel}</span>.
        </p>
      </div>
    );
  }

  return null;
}

export function ProviderPending() {
  return null;
}
