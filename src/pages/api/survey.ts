import type { APIRoute } from "astro";
import { parseAnswers } from "../../lib/survey";
import { MAX_TOKEN_AGE_MS, MIN_FILL_MS, hashIp, issueFormToken, readFormToken } from "../../lib/survey-server";
import { createSupabaseAdminClient } from "../../lib/supabase-server";
import { getOrigin } from "../../lib/get-origin";

const MAX_BODY_BYTES = 16_000; // generous cap, a full answer set is under 3 KB
const MAX_PER_IP_HOUR = 40; // workshop rooms share one IP, so keep this loose

/** Builds a JSON response with the given status. */
function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
    const origin = request.headers.get("Origin");
    if (!origin || origin !== getOrigin(request)) return json({ error: "origin" }, 403);

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: "invalid" }, 413);

    let raw: Record<string, unknown>;
    try {
        raw = JSON.parse(text);
    } catch {
        return json({ error: "invalid" }, 400);
    }
    if (!raw || typeof raw !== "object") return json({ error: "invalid" }, 400);

    const token = readFormToken(raw.token);
    if (!token) return json({ error: "expired", token: issueFormToken() }, 400);
    if (raw.website || token.ageMs < MIN_FILL_MS) return json({ ok: true });
    if (token.ageMs > MAX_TOKEN_AGE_MS) return json({ error: "expired", token: issueFormToken() }, 400);

    const answers = parseAnswers(raw);
    if (!answers) return json({ error: "invalid" }, 422);

    let supabase;
    try {
        supabase = createSupabaseAdminClient();
    } catch {
        return json({ error: "config" }, 503);
    }

    const { data: allowed, error: rateError } = await supabase.rpc("survey_rate_hit", {
        p_hash: hashIp(clientAddress ?? "unknown"),
        p_limit: MAX_PER_IP_HOUR,
    });
    if (rateError) return json({ error: "generic" }, 500);
    if (!allowed) return json({ error: "rate" }, 429);

    const { error } = await supabase
        .from("survey_responses")
        .insert({ token_id: token.id, ...answers });
    if (error && error.code !== "23505") return json({ error: "generic" }, 500);

    return json({ ok: true });
};
