import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from './supabase-server';
import { getApiUrl } from './endpoint-config';

export interface CurrentUser {
    id: string;
    email: string | null;
    display_name: string | null;
    role: string | null;
}

export async function getOptionalUser(
    cookies: AstroCookies,
    cookieHeader: string,
): Promise<CurrentUser | null> {
    const supabase = createSupabaseServerClient(cookies, cookieHeader, { readOnly: true });
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

    let role: string | null = null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/profiles/me`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const apiProfile = await res.json();
                role = apiProfile.role ?? null;
            }
        }
    } catch {}

    return {
        id: user.id,
        email: user.email ?? null,
        display_name:
            profile?.display_name ??
            (user.user_metadata?.display_name as string | undefined) ??
            user.email ??
            null,
        role,
    };
}
