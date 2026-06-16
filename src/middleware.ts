import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
    const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

    if (url && anonKey) {
        const supabase = createServerClient(url, anonKey, {
            cookies: {
                getAll: () =>
                    parseCookieHeader(context.request.headers.get('Cookie') ?? '')
                        .filter((c): c is { name: string; value: string } => c.value !== undefined),
                setAll: (cookiesToSet) =>
                    cookiesToSet.forEach(({ name, value, options }) => {
                        try {
                            context.cookies.set(name, value, options);
                        } catch {
                        }
                    }),
            },
        });

        try {
            await supabase.auth.getUser();
        } catch {
            const cookieHeader = context.request.headers.get('Cookie') ?? '';
            const parsed = parseCookieHeader(cookieHeader);
            for (const cookie of parsed) {
                if (cookie.name?.includes('auth-token')) {
                    try {
                        context.cookies.delete(cookie.name, { path: '/' });
                    } catch {
                    }
                }
            }
        }
    }

    return next();
});
