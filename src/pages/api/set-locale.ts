import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
    const referer = request.headers.get("referer") || "/";
    const form = await request.formData();
    const locale = form.get("locale");

    if (locale === "de" || locale === "en") {
        cookies.set("locale", locale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: false,
            sameSite: "lax",
        });
    }

    return redirect(referer, 302);
};

