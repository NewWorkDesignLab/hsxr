import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';

export const POST: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers({ 'Content-Type': 'application/json' });
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const body = (await request.json().catch(() => null)) as
        | { email?: string; password?: string }
        | null;
    if (!body?.email || !body.password) {
        return new Response(JSON.stringify({ error: 'Email and password required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
    });
    if (error || !data.session) {
        const rawMsg = error?.message ?? 'Login failed.';
        const code = (error as { code?: string } | null)?.code;
        const emailNotConfirmed =
            code === 'email_not_confirmed' ||
            /email not confirmed/i.test(rawMsg);

        const friendlyMsg = emailNotConfirmed
            ? 'Email not confirmed. Please check your inbox or request a new confirmation link.'
            : rawMsg;

        return new Response(
            JSON.stringify({
                error: friendlyMsg,
                code: emailNotConfirmed ? 'email_not_confirmed' : code,
                emailNotConfirmed,
            }),
            {
                status: emailNotConfirmed ? 403 : 401,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.user.id)
        .single();

    return new Response(
        JSON.stringify({
            ok: true,
            display_name:
                profile?.display_name ??
                (data.user.user_metadata?.display_name as string | undefined) ??
                data.user.email,
        }),
        { status: 200, headers: responseHeaders },
    );
};
