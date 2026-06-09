import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authedResponse, authorize } from "./_auth";

export const POST: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;
    const authHeaders = auth.authHeaders;

    let name = "";
    try {
        const data = (await request.json()) as { name?: string };
        name = data?.name ?? "";
    } catch {}
    if (!name) {
        return authedResponse(
            JSON.stringify({ error: "name required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
            authHeaders,
        );
    }

    try {
        const upstream = await fetch(`${getApiUrl()}/models/upload-url`, {
            method: "POST",
            headers: {
                ...auth.upstreamHeaders,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
        });
        if (!upstream.ok) {
            return authedResponse(
                JSON.stringify({ error: "no signed url" }),
                { status: 404, headers: { "Content-Type": "application/json" } },
                authHeaders,
            );
        }
        const data = (await upstream.json()) as { url?: string; method?: string };
        if (!data?.url) {
            return authedResponse(
                JSON.stringify({ error: "no url in response" }),
                { status: 404, headers: { "Content-Type": "application/json" } },
                authHeaders,
            );
        }
        return authedResponse(
            JSON.stringify({ url: data.url, method: data.method ?? "PUT" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
            authHeaders,
        );
    } catch {
        return authedResponse(
            JSON.stringify({ error: "upstream failed" }),
            { status: 502, headers: { "Content-Type": "application/json" } },
            authHeaders,
        );
    }
};
