/**
 * Tracks whether the configured OpenRouter models are currently usable.
 *
 * The free tier returns 429 after a handful of calls and occasionally answers
 * with an empty body, so a demo needs to know the difference between "the app is
 * broken" and "wait a moment". State is in-process and resets on server restart,
 * which is accurate enough: the limit is time-based, not session-based.
 */

type State = {
  /** Last time a provider call was rate limited. */
  rateLimitedAt: number | null;
  /** Last time a provider call succeeded. */
  lastOkAt: number | null;
  lastModel: string | null;
};

const globalRef = globalThis as unknown as { __intelProviderState?: State };

const state: State = (globalRef.__intelProviderState ??= {
  rateLimitedAt: null,
  lastOkAt: null,
  lastModel: null,
});

/** Free-tier rate limits clear in about a minute. */
const COOLDOWN_MS = 60_000;

export function recordSuccess(model: string) {
  state.lastOkAt = Date.now();
  state.lastModel = model;
}

export function recordRateLimit(model: string) {
  state.rateLimitedAt = Date.now();
  state.lastModel = model;
}

export function getProviderStatus() {
  const now = Date.now();
  const rateLimitedAt = state.rateLimitedAt;
  const cooling = rateLimitedAt !== null && now - rateLimitedAt < COOLDOWN_MS;

  return {
    /** True while the free tier is known to be rejecting calls. */
    rateLimited: cooling,
    /** Seconds until the cooldown expires; 0 when not cooling down. */
    retryInSeconds:
      cooling && rateLimitedAt !== null
        ? Math.ceil((COOLDOWN_MS - (now - rateLimitedAt)) / 1000)
        : 0,
    lastModel: state.lastModel,
    lastOkAt: state.lastOkAt,
  };
}

export type ProviderStatus = ReturnType<typeof getProviderStatus>;
