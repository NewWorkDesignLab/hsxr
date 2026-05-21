import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";

export const GET: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const upstream = await fetch(`${getApiUrl()}/auth/me`, { headers: { cookie } });
    const resBody = await upstream.text();
    return new Response(resBody, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
    });
};

