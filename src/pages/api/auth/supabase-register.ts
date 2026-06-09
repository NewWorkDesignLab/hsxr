import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';
import { getOrigin } from '../../../lib/get-origin';

const DISPLAY_NAME_RE = /^[\p{L}\p{N} ._-]+$/u;

function jsonError(msg: string, status: number) {
    return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export const POST: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers({ 'Content-Type': 'application/json' });
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const body = (await request.json().catch(() => null)) as
        | { email?: string; password?: string; display_name?: string }
        | null;

    if (!body?.email || !body.password || !body.display_name) {
        return jsonError('Email, password and display name required.', 400);
    }
    if (body.password.length < 8) {
        return jsonError('Password must be at least 8 characters.', 400);
    }

    const trimmedName = body.display_name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 24) {
        return jsonError('Display name must be 3–24 characters.', 400);
    }
    if (!DISPLAY_NAME_RE.test(trimmedName)) {
        return jsonError('Display name contains invalid characters.', 400);
    }

    const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: {
            data: { display_name: trimmedName },
            emailRedirectTo: `${getOrigin(request)}/api/auth/callback?flow=signup`,
        },
    });

    if (error) {
        let msg = error.message;
        if (/user already registered/i.test(msg)) {
            msg = 'This email is already registered.';
        } else if (/duplicate key|23505|unique/i.test(msg)) {
            msg = 'This display name is already taken.';
        }
        return jsonError(msg, 400);
    }

    return new Response(
        JSON.stringify({
            ok: true,
            needsConfirmation: !data.session,
            display_name: trimmedName,
        }),
        { status: 200, headers: responseHeaders },
    );
};
