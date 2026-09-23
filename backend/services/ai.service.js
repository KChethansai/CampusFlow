import OpenAI from 'openai';
import crypto from 'crypto';

export function hashDataSnapshot(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

const PLACEHOLDER_SUMMARY =
  'AI service is not configured. Set OPENAI_API_KEY to enable grounded insights.';

const MAX_ATTEMPTS = 3; // initial + 2 retries on transient failures only
const RETRYABLE = (err) => err?.status === 429 || (err?.status >= 500 && err?.status <= 599);
const backoffMs = (attempt) => 500 * 2 ** attempt; // 500ms, 1s
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function generatePerformanceSummary(student, performanceData) {
  const snapshotHash = hashDataSnapshot(performanceData);

  // Read the key at call time so .env values are picked up regardless of
  // module evaluation order (config/env.js runs dotenv lazily at boot).
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      summary: PLACEHOLDER_SUMMARY,
      provider: 'none',
      snapshotHash
    };
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  let lastErr = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an academic assistant that generates grounded performance summaries based strictly on provided student data.'
          },
          {
            role: 'user',
            content: `Generate a concise performance summary for student ${student.name}.\n\nData:\n${JSON.stringify(performanceData, null, 2)}\n\nData snapshot hash: ${snapshotHash}`
          }
        ],
        temperature: 0.3
      });

      return {
        summary: response.choices[0].message.content,
        provider: model,
        snapshotHash
      };
    } catch (err) {
      lastErr = err;
      if (!RETRYABLE(err) || attempt === MAX_ATTEMPTS - 1) break; // auth/bad-request: fail fast
      await sleep(backoffMs(attempt)); // transient: exponential backoff
    }
  }
  // Degrade gracefully (bad key, rate limit, network) instead of failing the request.
  return {
    summary: `AI generation failed (${lastErr.message}). Check OPENAI_API_KEY and try again.`,
    provider: 'none',
    snapshotHash
  };
}
