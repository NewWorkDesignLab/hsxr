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
            `/account?toast=error&msg=${encodeURIComponent('Invalid link.')}`,
        );
    }

    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return buildRedirect(
            `/account?toast=error&msg=${encodeURIComponent('Link expired or invalid.')}`,
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

    // Signup confirmed — sign the user out so they explicitly log in.
    await supabase.auth.signOut({ scope: 'local' });
    return buildRedirect(
        `/account?toast=success&msg=${encodeURIComponent(
            'Email confirmed! You can now log in.',
        )}`,
        responseHeaders,
    );
};
