import type { APIRoute } from "astro";
import { createSupabaseServerClientFromRequest } from "../../../lib/supabase-server";
import { getApiUrl } from "../../../lib/endpoint-config";

export const GET: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/profiles/me`, {
        headers: {
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    if (!res.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch profile" }), {
            status: res.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const profile = await res.json();
    return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};

