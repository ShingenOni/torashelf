import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export type RateLimitAction = "SUBMIT_GAME" | "VOTE" | "REPORT";

type RateLimitConfig = {
  userMax: number;
  ipMax: number;
  windowMinutes: number;
  label: string;
};

// Arbitrary but reasonable starting points — easy to retune later. IP-based
// limiting only carries real weight once deployed behind something that
// sets x-forwarded-for correctly (e.g. Vercel); until then it's a no-op
// best-effort layer, not the primary defense.
const LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  SUBMIT_GAME: { userMax: 5, ipMax: 10, windowMinutes: 60, label: "submissions" },
  VOTE: { userMax: 30, ipMax: 60, windowMinutes: 60, label: "votes" },
  REPORT: { userMax: 10, ipMax: 20, windowMinutes: 60, label: "reports" },
};

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip");
}

// Checks the window, and if under the limit, records this attempt in the
// same call — so a caller only needs one round-trip, and a rejected attempt
// never itself counts toward the limit.
export async function enforceRateLimit(
  action: RateLimitAction,
  userId: string | null,
  ip: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = LIMITS[action];
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  if (userId) {
    const userCount = await prisma.rateLimitEvent.count({
      where: { action, userId, createdAt: { gte: windowStart } },
    });
    if (userCount >= config.userMax) {
      return { ok: false, error: `Too many ${config.label} — try again in a bit.` };
    }
  }

  if (ip) {
    const ipCount = await prisma.rateLimitEvent.count({
      where: { action, ipAddress: ip, createdAt: { gte: windowStart } },
    });
    if (ipCount >= config.ipMax) {
      return { ok: false, error: "Too many requests from this network — try again later." };
    }
  }

  await prisma.rateLimitEvent.create({ data: { action, userId, ipAddress: ip } });
  return { ok: true };
}
