import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authorize } from "./_auth";

export const GET: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;

    const url = new URL(request.url);
    const name = url.searchParams.get("name") ?? "";
    if (!name) {
        return new Response(JSON.stringify({ error: "name required" }), { status: 400 });
    }
    const upstream = await fetch(`${getApiUrl()}/models/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (!upstream.ok) {
        return new Response(JSON.stringify({ error: "not found" }), { status: upstream.status });
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
    return new Response(upstream.body, { status: 200, headers });
};

