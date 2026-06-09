import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authedResponse, authorize } from "./_auth";

export const DELETE: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const name = url.searchParams.get("name") ?? "";
    if (!name) {
        return authedResponse(
            JSON.stringify({ error: "name required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
            auth.authHeaders,
        );
    }
    const upstream = await fetch(`${getApiUrl()}/models/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: auth.upstreamHeaders,
    });
    return authedResponse(null, { status: upstream.status }, auth.authHeaders);
};
