import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';
import { getOrigin } from '../../../lib/get-origin';

export const POST: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers({ 'Content-Type': 'application/json' });
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    if (!body?.email) {
        return new Response(JSON.stringify({ error: 'Email required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: body.email,
        options: {
            emailRedirectTo: `${getOrigin(request)}/api/auth/callback?flow=signup`,
        },
    });

    if (error) {
        let msg = error.message;
        if (
            /already (confirmed|registered)/i.test(msg) ||
            /not found/i.test(msg) ||
            /user.*confirmed/i.test(msg)
        ) {
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: responseHeaders,
            });
        }
        if (/rate limit|too many|retry/i.test(msg)) {
            msg = 'Too many requests. Please wait a moment and try again.';
        }
        return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: responseHeaders,
    });
};

