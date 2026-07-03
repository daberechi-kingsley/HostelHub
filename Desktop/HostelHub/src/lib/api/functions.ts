/**
 * Typed wrappers around Firebase Cloud Functions.
 *
 * Emulator strategy:
 *   The Firebase SDK's httpsCallable makes a pre-flight metadata request that
 *   stalls against the demo project emulator in Vite dev mode. For the emulator
 *   we therefore call the Functions HTTP endpoint directly (proven to work).
 *   In production we use the standard httpsCallable SDK so Auth + App Check
 *   headers are included automatically.
 *
 * All Anthropic / server-side logic lives in Cloud Functions — never the client.
 */
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/functions';
import { env } from '@/config/env';

/** Emulator base URL — matches firebase.json emulator port 5001. */
const EMULATOR_BASE = 'http://localhost:5001/demo-hostelhub/europe-west1';

// ── aiSearch ──────────────────────────────────────────────────────────────
export interface AiSearchRequest {
  query: string;
}

export interface AiSearchResponse {
  /** Listing IDs ordered most-relevant → least-relevant by Claude Haiku 4.5. */
  rankedIds: string[];
  model: string;
  /** True when the function degraded gracefully (e.g. no API key set). */
  degraded?: boolean;
}

export async function callAiSearch(req: AiSearchRequest): Promise<AiSearchResponse> {
  if (env.useEmulators) {
    // Direct HTTP — avoids the SDK pre-flight that stalls against demo project IDs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000); // 10-second timeout
    try {
      const res = await fetch(`${EMULATOR_BASE}/aiSearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: req }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`aiSearch HTTP ${res.status}`);
      const json = (await res.json()) as { result?: AiSearchResponse };
      return json.result ?? { rankedIds: [], model: 'claude-haiku-4-5-20251001', degraded: true };
    } finally {
      clearTimeout(timer);
    }
  }

  // Production: use Firebase callable protocol (includes Auth + App Check headers)
  const fn = httpsCallable<AiSearchRequest, AiSearchResponse>(
    getFirebaseFunctions(),
    'aiSearch',
  );
  const result = await fn(req);
  return result.data;
}

// ── resolveChatCounterpart ─────────────────────────────────────────────────
export interface ResolveChatRequest {
  listingId: string;
}

export interface ResolveChatResponse {
  counterpartUid: string | null;
  mode: 'concierge' | 'direct';
}

export async function callResolveChatCounterpart(
  req: ResolveChatRequest,
): Promise<ResolveChatResponse> {
  if (env.useEmulators) {
    const res = await fetch(`${EMULATOR_BASE}/resolveChatCounterpart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: req }),
    });
    if (!res.ok) throw new Error(`resolveChatCounterpart HTTP ${res.status}`);
    const json = (await res.json()) as { result?: ResolveChatResponse };
    return json.result ?? { counterpartUid: null, mode: 'concierge' };
  }

  const fn = httpsCallable<ResolveChatRequest, ResolveChatResponse>(
    getFirebaseFunctions(),
    'resolveChatCounterpart',
  );
  const result = await fn(req);
  return result.data;
}
