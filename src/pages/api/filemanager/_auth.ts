import type { APIContext } from "astro";
import { createSupabaseServerClientFromRequest } from "../../../lib/supabase-server";

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

export async function requireSupabaseUser(request: Request) {
    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return { user: user ?? null, authHeaders: responseHeaders };
}

export async function authorize(
    context: Pick<APIContext, "request">,
): Promise<
    | { upstreamHeaders: Record<string, string>; authHeaders: Headers; response?: undefined }
    | { upstreamHeaders?: undefined; authHeaders?: undefined; response: Response }
> {
    const { user, authHeaders } = await requireSupabaseUser(context.request);
    if (!user) return { response: unauthorized("Not logged in.", authHeaders) };

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
