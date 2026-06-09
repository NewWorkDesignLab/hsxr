import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authorize } from "./_auth";

export const GET: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;

    const upstream = await fetch(`${getApiUrl()}/models`, {
        headers: { Authorization: `Bearer ${auth.token}` },
    });
    const body = await upstream.text();
    return new Response(body, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
    });
};

