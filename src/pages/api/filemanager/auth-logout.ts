import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";

export const POST: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const upstream = await fetch(`${getApiUrl()}/auth/logout`, {
        method: "POST",
        headers: { cookie },
    });
    const headers = new Headers({ "Content-Type": "application/json" });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) headers.set("set-cookie", setCookie);
    return new Response(JSON.stringify({ ok: true }), { status: upstream.status, headers });
};

