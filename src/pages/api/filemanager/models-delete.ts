import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authorize } from "./_auth";

export const DELETE: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const name = url.searchParams.get("name") ?? "";
    if (!name) {
        return new Response(JSON.stringify({ error: "name required" }), { status: 400 });
    }
    const upstream = await fetch(`${getApiUrl()}/models/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
    });
    return new Response(null, { status: upstream.status });
};
