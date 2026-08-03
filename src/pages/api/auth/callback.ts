import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase-server';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change'];

function isOtpType(value: string | null): value is EmailOtpType {
    return value !== null && OTP_TYPES.includes(value as EmailOtpType);
}

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');

    const isRecovery = type === 'recovery' || url.searchParams.get('flow') === 'recovery';

    const buildRedirect = (location: string, extraHeaders?: Headers) => {
        const headers = new Headers(extraHeaders);
        headers.set('Location', location);
        return new Response(null, { status: 302, headers });
    };

    const linkFailed = () =>
        isRecovery
            ? buildRedirect(
                `/account?mode=recovery-expired&toast=error&msg=${encodeURIComponent(
                    'Reset link expired or already used. Request a new one below.',
                )}`,
            )
            : buildRedirect(`/account?mode=link-invalid`);

    if (!code && !tokenHash) {
        return linkFailed();
    }

    const responseHeaders = new Headers();
    const supabase = createSupabaseServerClientFromRequest(request, responseHeaders);

    const { error } = tokenHash
        ? await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: isOtpType(type) ? type : 'email',
        })
        : await supabase.auth.exchangeCodeForSession(code!);

    if (error) {
        return linkFailed();
    }

    if (isRecovery) {
        return buildRedirect(
            `/account?mode=update-password&toast=info&msg=${encodeURIComponent(
                'Set your new password below.',
            )}`,
            responseHeaders,
        );
    }

    await supabase.auth.signOut({ scope: 'global' }).catch(() => undefined);
    return buildRedirect(
        `/account?mode=confirmed&toast=success&msg=${encodeURIComponent(
            'Email confirmed! You can now log in.',
        )}`,
    );
};
