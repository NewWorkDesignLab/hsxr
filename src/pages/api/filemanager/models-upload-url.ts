import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { getBearerToken, unauthorized } from "./_auth";

export const POST: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const token = await getBearerToken(cookie);
    if (!token) return unauthorized();

    let name = "";
    try {
        const data = (await request.json()) as { name?: string };
        name = data?.name ?? "";
    } catch {}
    if (!name) {
        return new Response(JSON.stringify({ error: "name required" }), { status: 400 });
    }

    try {
        const upstream = await fetch(`${getApiUrl()}/models/upload-url`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
        });
        if (!upstream.ok) {
            return new Response(JSON.stringify({ error: "no signed url" }), { status: 404 });
        }
        const data = (await upstream.json()) as { url?: string; method?: string };
        if (!data?.url) {
            return new Response(JSON.stringify({ error: "no url in response" }), { status: 404 });
        }
        return new Response(JSON.stringify({ url: data.url, method: data.method ?? "PUT" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "upstream failed" }), { status: 502 });
    }
};

