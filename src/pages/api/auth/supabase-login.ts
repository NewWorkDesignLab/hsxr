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
        return new Response(JSON.stringify({ error: error?.message ?? 'Login failed.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
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
