import type { APIContext } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { createSupabaseServerClientFromRequest } from "../../../lib/supabase-server";

export function unauthorized(msg = "Unauthorized") {
    return new Response(JSON.stringify({ error: msg }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
    });
}

export async function requireSupabaseUser(request: Request) {
    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
}

const TOKEN_TTL_SECONDS = 120;
const TOKEN_REFRESH_SAFETY_MS = 10_000;

interface CachedToken {
    token: string;
    expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let inflight: Promise<string | null> | null = null;

function extractSessionCookie(setCookieHeader: string | null): string | null {
    if (!setCookieHeader) return null;
    const parts = setCookieHeader.split(/,(?=[^;]+=[^;]*)/);
    const pairs: string[] = [];
    for (const part of parts) {
        const first = part.split(";")[0]?.trim();
        if (first && first.includes("=")) pairs.push(first);
    }
    return pairs.length ? pairs.join("; ") : null;
}

async function fetchBearerFromUpstream(): Promise<string | null> {
    const password = process.env.HSXR_FILEMANAGER_PASSWORD;
    if (!password) {
        return null;
    }

    const loginRes = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });
    if (!loginRes.ok) return null;

    const sessionCookie = extractSessionCookie(loginRes.headers.get("set-cookie"));
    if (!sessionCookie) return null;

    const tokenRes = await fetch(`${getApiUrl()}/auth/token?ttl=${TOKEN_TTL_SECONDS}`, {
        method: "POST",
        headers: { cookie: sessionCookie },
    });
    if (!tokenRes.ok) return null;

    const data = (await tokenRes.json()) as { token?: string };
    return data.token ?? null;
}

export async function getBearerToken(): Promise<string | null> {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now) {
        return cachedToken.token;
    }

    if (inflight) return inflight;

    inflight = (async () => {
        const token = await fetchBearerFromUpstream();
        if (token) {
            cachedToken = {
                token,
                expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 - TOKEN_REFRESH_SAFETY_MS,
            };
        }
        return token;
    })();

    try {
        return await inflight;
    } finally {
        inflight = null;
    }
}

export async function authorize(
    context: Pick<APIContext, "request">,
): Promise<{ token: string; response?: undefined } | { token?: undefined; response: Response }> {
    const user = await requireSupabaseUser(context.request);
    if (!user) return { response: unauthorized() };

    const token = await getBearerToken();
    if (!token) return { response: unauthorized("Upstream token unavailable") };

    return { token };
}

