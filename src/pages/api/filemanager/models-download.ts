import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { appendAuthHeaders, authedResponse, authorize } from "./_auth";

export const GET: APIRoute = async ({ request }) => {
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
        headers: auth.upstreamHeaders,
    });
    if (!upstream.ok) {
        return authedResponse(
            JSON.stringify({ error: "not found" }),
            {
                status: upstream.status,
                headers: { "Content-Type": "application/json" },
            },
            auth.authHeaders,
        );
    }
    const headers = new Headers();
    const cd = upstream.headers.get("content-disposition");
    const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
    const cl = upstream.headers.get("content-length");
    if (cd) headers.set("content-disposition", cd);
    headers.set("content-type", ct);
    headers.set("cache-control", "no-store");
    headers.set("content-encoding", "identity");
    if (cl) headers.set("content-length", cl);
    appendAuthHeaders(headers, auth.authHeaders);
    return new Response(upstream.body, { status: 200, headers });
};
