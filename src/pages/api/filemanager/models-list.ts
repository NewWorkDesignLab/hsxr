import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { getBearerToken, unauthorized } from "./_auth";

export const GET: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const token = await getBearerToken(cookie);
    if (!token) return unauthorized();
    const upstream = await fetch(`${getApiUrl()}/models`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const body = await upstream.text();
    return new Response(body, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
    });
};

