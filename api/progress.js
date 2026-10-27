// Vercel serverless function: stores the single shared progress record in Upstash Redis.
// GET  /api/progress  -> current progress (or null)
// PUT  /api/progress  -> merges the sent progress with what's stored, returns the result
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const KEY = "thirty-days:progress";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function clean(s) {
  const out = { revealed: {}, start: null, resetAt: 0 };
  if (!s || typeof s !== "object") return out;
  if (s.revealed && typeof s.revealed === "object") {
    for (const [n, d] of Object.entries(s.revealed)) {
      const i = Number(n);
      if (Number.isInteger(i) && i >= 1 && i <= 30 && DATE.test(String(d))) out.revealed[i] = String(d);
    }
  }
  if (DATE.test(String(s.start))) out.start = String(s.start);
  if (Number.isFinite(s.resetAt) && s.resetAt > 0) out.resetAt = s.resetAt;
  return out;
}

// Same rule as the page: a newer "Start over" wins; otherwise keep every reveal.
function merge(a, b) {
  if (a.resetAt !== b.resetAt) return a.resetAt > b.resetAt ? a : b;
  const starts = [a.start, b.start].filter(Boolean).sort();
  return { revealed: { ...b.revealed, ...a.revealed }, start: starts[0] || null, resetAt: a.resetAt };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const stored = await redis.get(KEY);
      return res.status(200).json(stored ? clean(stored) : null);
    }
    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const stored = clean(await redis.get(KEY));
      const next = merge(clean(body), stored);
      await redis.set(KEY, next);
      return res.status(200).json(next);
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Use GET or PUT." });
  } catch (e) {
    return res.status(500).json({ error: "Storage is not set up. Connect an Upstash Redis database in Vercel." });
  }
}
