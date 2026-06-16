import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    const apiKey = import.meta.env.HSXR_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "Server configuration error." }),
            { status: 503, headers: { "Content-Type": "application/json" } },
        );
    }

    let body: { name?: string; email?: string; company?: string; website?: string };
    try {
        body = await request.json();
    } catch {
        return new Response(
            JSON.stringify({ error: "Invalid request body." }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const company = (body.company ?? "").trim();
    const website = body.website ?? "";

    if (!name || !email) {
        return new Response(
            JSON.stringify({ error: "Name and email are required." }),
            { status: 422, headers: { "Content-Type": "application/json" } },
        );
    }

    try {
        const res = await fetch("https://api.holospacexr.com/contacts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey,
            },
            body: JSON.stringify({ name, email, company, website }),
        });

        const data = await res.json().catch(() => ({}));
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(
            JSON.stringify({ error: "Upstream service unavailable." }),
            { status: 502, headers: { "Content-Type": "application/json" } },
        );
    }
};

