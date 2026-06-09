import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';

export const POST: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers({ 'Content-Type': 'application/json' });
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const body = (await request.json().catch(() => null)) as
        | { password?: string; currentPassword?: string }
        | null;
    if (!body?.password || body.password.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (body.currentPassword && user.email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: body.currentPassword,
        });
        if (reauthError) {
            return new Response(JSON.stringify({ error: 'Current password is incorrect.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    const { error } = await supabase.auth.updateUser({ password: body.password });
    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: responseHeaders,
    });
};
