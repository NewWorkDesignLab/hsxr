import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authorize } from "./_auth";

export const POST: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;
    const token = auth.token;

    let fileBuffer: ArrayBuffer;
    let fileName = "upload.glb";
    let fileType = "application/octet-stream";

    try {
        const formData = await request.formData();
        const fileEntry = formData.get("file");
        if (!(fileEntry instanceof File)) {
            return new Response(JSON.stringify({ error: "file field required" }), { status: 400 });
        }
        fileBuffer = await fileEntry.arrayBuffer();
        fileName = fileEntry.name || fileName;
        fileType = fileEntry.type || fileType;
    } catch {
        return new Response(JSON.stringify({ error: "invalid form data" }), { status: 400 });
    }

    try {
        const signedRes = await fetch(`${getApiUrl()}/models/upload-url`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: fileName }),
        });

        if (signedRes.ok) {
            const { url, method } = (await signedRes.json()) as { url?: string; method?: string };
            if (url) {
                const uploadMethod = method ?? "PUT";
                const uploadRes = await fetch(url, {
                    method: uploadMethod,
                    headers: { "Content-Type": fileType },
                    body: fileBuffer,
                });
                return new Response(
                    JSON.stringify({ ok: uploadRes.ok, status: uploadRes.status }),
                    { status: uploadRes.ok ? 200 : uploadRes.status }
                );
            }
        }

        const fallback = await fetch(`${getApiUrl()}/models`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": fileType,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
            },
            body: fileBuffer,
        });
        const resBody = await fallback.text();
        return new Response(resBody, {
            status: fallback.status,
            headers: { "Content-Type": "application/json" },
        });
    } catch {
        return new Response(JSON.stringify({ error: "upstream unreachable" }), { status: 502 });
    }
};
