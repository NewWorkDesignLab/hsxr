import { getApiUrl } from "../../../lib/endpoint-config";

export async function getBearerToken(cookie: string): Promise<string | null> {
    const r = await fetch(`${getApiUrl()}/auth/token?ttl=120`, {
        method: "POST",
        headers: { cookie },
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.token ?? null;
}

export function unauthorized(msg = "Nicht authentifiziert") {
    return new Response(JSON.stringify({ error: msg }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
    });
}

