/**
 * Shared Gemini / Vertex AI client factory (`@google/genai` SDK).
 *
 * Prefers Vertex AI mode (Cloud Run service-account ADC) when
 * `GOOGLE_GENAI_USE_VERTEXAI` is truthy; otherwise falls back to API-key mode for
 * local development. The legacy direct REST-with-key path is no longer used.
 *
 * Environment variables:
 * - `GOOGLE_GENAI_USE_VERTEXAI` — truthy → Vertex AI mode (no API key needed).
 * - `GOOGLE_CLOUD_PROJECT`      — default `gen-lang-client-0243034020`.
 * - `GOOGLE_CLOUD_LOCATION`     — default `us-central1`.
 * - `GEMINI_MODEL`              — default `gemini-2.5-flash`.
 * - `GEMINI_API_KEY` / `GOOGLE_API_KEY` — only used in local API-key fallback.
 */
import { GoogleGenAI } from '@google/genai';

const DEFAULT_PROJECT = 'gen-lang-client-0243034020';
const DEFAULT_LOCATION = 'us-central1';
const DEFAULT_MODEL = 'gemini-2.5-flash';

function isVertexMode(): boolean {
  return ['1', 'true', 'yes', 'on'].includes(
    (process.env.GOOGLE_GENAI_USE_VERTEXAI || '').trim().toLowerCase()
  );
}

export function useVertex(): boolean {
  return isVertexMode();
}

export function getModelName(): string {
  return (process.env.GEMINI_MODEL || '').trim() || DEFAULT_MODEL;
}

function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

/** True when an AI client can be constructed (Vertex on, or an API key set). */
export function aiAvailable(): boolean {
  return isVertexMode() || Boolean(apiKey());
}

let loggedInit = false;
function logInit(vertex: boolean, project: string, location: string, model: string): void {
  if (loggedInit) return;
  loggedInit = true;
  if (vertex) {
    console.info(
      `AI client: Vertex AI mode ENABLED (project=${project}, location=${location}, model=${model})`
    );
  } else {
    console.warn(`AI client: Vertex AI DISABLED, falling back to API-key mode (model=${model})`);
  }
}

/**
 * Return a configured `GoogleGenAI` client. Vertex mode uses Application Default
 * Credentials (Cloud Run service account); no API key is read or logged.
 * Throws when neither Vertex nor an API key is available.
 */
export function getGenAIClient(): GoogleGenAI {
  const project = process.env.GOOGLE_CLOUD_PROJECT || DEFAULT_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_LOCATION;
  const model = getModelName();

  if (isVertexMode()) {
    logInit(true, project, location, model);
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  const key = apiKey();
  if (key) {
    logInit(false, project, location, model);
    return new GoogleGenAI({ apiKey: key });
  }

  throw new Error(
    'No AI client available: set GOOGLE_GENAI_USE_VERTEXAI=true to use Vertex AI ' +
      '(Cloud Run service account), or GEMINI_API_KEY for local API-key mode.'
  );
}

export function isQuotaError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  return ['429', 'quota', 'rate limit', 'rate-limit', 'resource_exhausted'].some((k) =>
    msg.includes(k)
  );
}

/**
 * Run `fn` with bounded exponential backoff on Vertex AI quota/429 errors.
 * Non-quota errors propagate immediately. Never retries indefinitely.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isQuotaError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}
