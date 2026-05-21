import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json().catch(() => null);
    if (!body?.password) {
        return new Response(JSON.stringify({ error: "password required" }), { status: 400 });
    }
    const upstream = await fetch(`${getApiUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: body.password }),
    });
    const resBody = await upstream.text();
    const headers = new Headers({ "Content-Type": "application/json" });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) headers.set("set-cookie", setCookie);
    return new Response(resBody, { status: upstream.status, headers });
};

