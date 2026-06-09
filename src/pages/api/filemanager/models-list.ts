import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authedResponse, authorize } from "./_auth";

export const GET: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;

    const upstream = await fetch(`${getApiUrl()}/models`, {
        headers: auth.upstreamHeaders,
    });
    const body = await upstream.text();
    return authedResponse(
        body,
        {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
        },
        auth.authHeaders,
    );
};
