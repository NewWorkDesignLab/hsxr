import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';

export const GET: APIRoute = async ({ request }) => {
    const responseHeaders = new Headers({ 'Content-Type': 'application/json' });
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return new Response(
            JSON.stringify({ loggedIn: false, display_name: null }),
            { status: 200, headers: responseHeaders },
        );
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

    return new Response(
        JSON.stringify({
            loggedIn: true,
            display_name:
                profile?.display_name ??
                (user.user_metadata?.display_name as string | undefined) ??
                user.email,
        }),
        { status: 200, headers: responseHeaders },
    );
};
