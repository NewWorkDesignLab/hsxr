import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { serviceKey } from "./supabase-server";

export const MIN_FILL_MS = 20_000; // faster submissions are treated as bots
export const MAX_TOKEN_AGE_MS = 12 * 60 * 60 * 1000; // form tokens expire after 12 hours

/** Signs a payload with an HMAC derived from the service role key. */
function sign(payload: string): string {
    return createHmac("sha256", serviceKey()).update(payload).digest("base64url");
}

/** Issues a single-use form token carrying a random id and the issue time. */
export function issueFormToken(): string {
    const payload = `${randomUUID()}.${Date.now()}`;
    return `${payload}.${sign(payload)}`;
}

/** Verifies a form token and returns its id and age, or null if forged or malformed. */
export function readFormToken(token: unknown): { id: string; ageMs: number } | null {
    if (typeof token !== "string" || token.length > 200) return null;
    const [id, ts, sig] = token.split(".");
    if (!id || !ts || !sig) return null;
    const expected = Buffer.from(sign(`${id}.${ts}`));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const issued = Number(ts);
    if (!Number.isFinite(issued)) return null;
    return { id, ageMs: Date.now() - issued };
}

/** Hashes a client IP with a daily rotating salt so raw addresses are never stored. */
export function hashIp(ip: string): string {
    const day = new Date().toISOString().slice(0, 10);
    return sign(`ip:${day}:${ip}`);
}
