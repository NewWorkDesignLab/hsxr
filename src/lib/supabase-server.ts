import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

function parseCookies(cookieHeader: string) {
    return parseCookieHeader(cookieHeader)
        .filter((c): c is { name: string; value: string } => c.value !== undefined);
}

function getEnv() {
    const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !anonKey) {
        throw new Error('PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY missing.');
    }
    return { url, anonKey };
}

export function createSupabaseServerClient(
    cookies: AstroCookies,
    requestCookieHeader = '',
) {
    const { url, anonKey } = getEnv();
    return createServerClient(url, anonKey, {
        cookies: {
            getAll: () => parseCookies(requestCookieHeader),
            setAll: (cookiesToSet) =>
                cookiesToSet.forEach(({ name, value, options }) => {
                    try {
                        cookies.set(name, value, options);
                    } catch {
                    }
                }),
        },
    });
}

export function createSupabaseServerClientFromRequest(
    request: Request,
    responseHeaders: Headers,
) {
    const { url, anonKey } = getEnv();
    return createServerClient(url, anonKey, {
        cookies: {
            getAll: () => parseCookies(request.headers.get('Cookie') ?? ''),
            setAll: (cookiesToSet) =>
                cookiesToSet.forEach(({ name, value, options }) => {
                    responseHeaders.append(
                        'Set-Cookie',
                        serializeCookieHeader(name, value, options),
                    );
                }),
        },
    });
}
