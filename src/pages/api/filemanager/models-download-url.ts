import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authorize } from "./_auth";

export const GET: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;
    const token = auth.token;

    const url = new URL(request.url);
    const name = url.searchParams.get("name") ?? "";
    if (!name) {
        return new Response(JSON.stringify({ error: "name required" }), { status: 400 });
    }

    try {
        const upstream = await fetch(
            `${getApiUrl()}/models/${encodeURIComponent(name)}/download-url`,
            { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!upstream.ok) {
            return new Response(JSON.stringify({ error: "no signed url" }), { status: 404 });
        }
        const data = (await upstream.json()) as { url?: string };
        if (!data?.url) {
            return new Response(JSON.stringify({ error: "no url in response" }), { status: 404 });
        }
        return new Response(JSON.stringify({ url: data.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "upstream failed" }), { status: 502 });
    }
};

