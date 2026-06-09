import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';

const DISPLAY_NAME_RE = /^[\p{L}\p{N} ._-]+$/u;

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
        | { display_name?: string }
        | null;
    const trimmed = body?.display_name?.trim() ?? '';
    if (trimmed.length < 3 || trimmed.length > 24) {
        return new Response(JSON.stringify({ error: 'Display name must be 3–24 characters.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    if (!DISPLAY_NAME_RE.test(trimmed)) {
        return new Response(JSON.stringify({ error: 'Display name contains invalid characters.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', user.id);

    if (profileError) {
        if (profileError.code === '23505') {
            return new Response(JSON.stringify({ error: 'Display name already taken.' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response(JSON.stringify({ error: profileError.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    await supabase.auth.updateUser({ data: { display_name: trimmed } });

    return new Response(JSON.stringify({ ok: true, display_name: trimmed }), {
        status: 200,
        headers: responseHeaders,
    });
};
