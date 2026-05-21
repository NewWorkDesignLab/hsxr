import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { getBearerToken, unauthorized } from "./_auth";

export const POST: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const token = await getBearerToken(cookie);
    if (!token) return unauthorized();
    const contentType = request.headers.get("content-type") ?? "";
    const body = await request.arrayBuffer();
    const upstream = await fetch(`${getApiUrl()}/models`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": contentType,
        },
        body,
    });
    const resBody = await upstream.text();
    return new Response(resBody, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
    });
};

