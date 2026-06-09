import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from './supabase-server';

export interface CurrentUser {
    id: string;
    email: string | null;
    display_name: string | null;
}

export async function getOptionalUser(
    cookies: AstroCookies,
    cookieHeader: string,
): Promise<CurrentUser | null> {
    const supabase = createSupabaseServerClient(cookies, cookieHeader);
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email ?? null,
        display_name:
            profile?.display_name ??
            (user.user_metadata?.display_name as string | undefined) ??
            user.email ??
            null,
    };
}
