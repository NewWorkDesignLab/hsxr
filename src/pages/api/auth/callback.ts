import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const flow = url.searchParams.get('flow') ?? 'signup';

    const buildRedirect = (location: string, extraHeaders?: Headers) => {
        const headers = new Headers(extraHeaders);
        headers.set('Location', location);
        return new Response(null, { status: 302, headers });
    };

    if (!code) {
        return buildRedirect(
            `/account?mode=link-invalid`,
        );
    }

    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        if (flow === 'recovery') {
            return buildRedirect(
                `/account?mode=recovery-expired&toast=error&msg=${encodeURIComponent(
                    'Reset link expired. Request a new one below.',
                )}`,
            );
        }
        return buildRedirect(
            `/account?mode=confirmed&toast=success&msg=${encodeURIComponent(
                'Email confirmed! You can now log in.',
            )}`,
        );
    }

    if (flow === 'recovery') {
        return buildRedirect(
            `/account?mode=update-password&toast=info&msg=${encodeURIComponent(
                'Set your new password below.',
            )}`,
            responseHeaders,
        );
    }

    await supabase.auth.signOut({ scope: 'global' }).catch(() => undefined);
    return buildRedirect(
        `/account?mode=confirmed&toast=success&msg=${encodeURIComponent(
            'Email confirmed! You can now log in.',
        )}`,
    );
};
