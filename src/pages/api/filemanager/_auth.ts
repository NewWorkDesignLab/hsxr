import type { APIContext } from "astro";
import { createSupabaseServerClientFromRequest } from "../../../lib/supabase-server";
import { getApiUrl } from "../../../lib/endpoint-config";

export function appendAuthHeaders(target: Headers, auth: Headers | undefined): void {
    if (!auth) return;
    const getSetCookie = (auth as unknown as { getSetCookie?: () => string[] })
        .getSetCookie;
    if (typeof getSetCookie === "function") {
        for (const cookie of getSetCookie.call(auth)) {
            target.append("Set-Cookie", cookie);
        }
        return;
    }
    auth.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
            target.append("Set-Cookie", value);
        }
    });
}

export function authedResponse(
    body: BodyInit | null,
    init: ResponseInit,
    authHeaders: Headers | undefined,
): Response {
    const headers = new Headers(init.headers);
    appendAuthHeaders(headers, authHeaders);
    return new Response(body, { ...init, headers });
}

export function unauthorized(msg = "Unauthorized", authHeaders?: Headers) {
    const headers = new Headers({ "Content-Type": "application/json" });
    appendAuthHeaders(headers, authHeaders);
    return new Response(JSON.stringify({ error: msg }), {
        status: 401,
        headers,
    });
}

export function forbidden(msg = "Forbidden", authHeaders?: Headers) {
    const headers = new Headers({ "Content-Type": "application/json" });
    appendAuthHeaders(headers, authHeaders);
    return new Response(JSON.stringify({ error: msg }), {
        status: 403,
        headers,
    });
}

export async function requireSupabaseUser(request: Request) {
    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return { user: user ?? null, session: session ?? null, authHeaders: responseHeaders };
}

export async function authorize(
    context: Pick<APIContext, "request">,
): Promise<
    | { upstreamHeaders: Record<string, string>; authHeaders: Headers; response?: undefined }
    | { upstreamHeaders?: undefined; authHeaders?: undefined; response: Response }
> {
    const { user, session, authHeaders } = await requireSupabaseUser(context.request);
    if (!user) return { response: unauthorized("Not logged in.", authHeaders) };

    // Check role via /profiles/me
    if (session?.access_token) {
        try {
            const apiUrl = getApiUrl();
            const profileRes = await fetch(`${apiUrl}/profiles/me`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (profileRes.ok) {
                const profile = await profileRes.json();
                if (profile.role !== "team") {
                    return { response: forbidden("Access restricted to team members.", authHeaders) };
                }
            } else {
                return { response: forbidden("Could not verify role.", authHeaders) };
            }
        } catch {
            return { response: forbidden("Could not verify role.", authHeaders) };
        }
    } else {
        return { response: unauthorized("No valid session.", authHeaders) };
    }

    const apiKey = process.env.HSXR_API_KEY ?? import.meta.env.HSXR_API_KEY;
    if (!apiKey) {
        return {
            response: unauthorized("Server is missing HSXR_API_KEY.", authHeaders),
        };
    }

    return {
        upstreamHeaders: { "X-API-Key": apiKey },
        authHeaders,
    };
}
