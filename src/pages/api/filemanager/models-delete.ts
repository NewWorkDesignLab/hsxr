import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { getBearerToken, unauthorized } from "./_auth";

export const DELETE: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const token = await getBearerToken(cookie);
    if (!token) return unauthorized();
    const url = new URL(request.url);
    const name = url.searchParams.get("name") ?? "";
    if (!name) {
        return new Response(JSON.stringify({ error: "name required" }), { status: 400 });
    }
    const upstream = await fetch(`${getApiUrl()}/models/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    return new Response(null, { status: upstream.status });
};

