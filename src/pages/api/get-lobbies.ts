import type { APIRoute } from "astro";
import { getApiUrl } from "../../lib/endpoint-config";

export const prerender = false;

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

const SERVER_TTL_MS = 1500;
let cache: { ts: number; body: string } | null = null;

export const GET: APIRoute = async () => {
    const apiKey = import.meta.env.HSXR_API_KEY;
    if (!apiKey) return json({ error: "API key not configured." }, 500);

    if (cache && Date.now() - cache.ts < SERVER_TTL_MS) {
        return new Response(cache.body, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, s-maxage=2, stale-while-revalidate=10",
                "X-Cache": "HIT",
            },
        });
    }

    try {
        const r = await fetch(`${getApiUrl()}/lobbies`, {
            headers: { "X-API-Key": apiKey },
        });
        if (!r.ok) {
            return json({ error: "Upstream failed", status: r.status }, r.status);
        }
        const body = await r.text();
        cache = { ts: Date.now(), body };
        return new Response(body, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, s-maxage=2, stale-while-revalidate=10",
                "X-Cache": "MISS",
            },
        });
    } catch (err) {
        console.error("[get-lobbies] fetch failed:", err);
        return json({ error: "Upstream unreachable." }, 502);
    }
};

