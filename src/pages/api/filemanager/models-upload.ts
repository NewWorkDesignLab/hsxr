import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { authedResponse, authorize } from "./_auth";

export const POST: APIRoute = async ({ request }) => {
    const auth = await authorize({ request });
    if (auth.response) return auth.response;
    const upstreamHeaders = auth.upstreamHeaders;
    const authHeaders = auth.authHeaders;

    let fileBuffer: ArrayBuffer;
    let fileName = "upload.glb";
    let fileType = "application/octet-stream";

    try {
        const formData = await request.formData();
        const fileEntry = formData.get("file");
        if (!(fileEntry instanceof File)) {
            return authedResponse(
                JSON.stringify({ error: "file field required" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
                authHeaders,
            );
        }
        fileBuffer = await fileEntry.arrayBuffer();
        fileName = fileEntry.name || fileName;
        fileType = fileEntry.type || fileType;
    } catch {
        return authedResponse(
            JSON.stringify({ error: "invalid form data" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
            authHeaders,
        );
    }

    try {
        const signedRes = await fetch(`${getApiUrl()}/models/upload-url`, {
            method: "POST",
            headers: {
                ...upstreamHeaders,
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
                return authedResponse(
                    JSON.stringify({ ok: uploadRes.ok, status: uploadRes.status }),
                    {
                        status: uploadRes.ok ? 200 : uploadRes.status,
                        headers: { "Content-Type": "application/json" },
                    },
                    authHeaders,
                );
            }
        }

        const fallback = await fetch(`${getApiUrl()}/models`, {
            method: "POST",
            headers: {
                ...upstreamHeaders,
                "Content-Type": fileType,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
            },
            body: fileBuffer,
        });
        const resBody = await fallback.text();
        return authedResponse(
            resBody,
            {
                status: fallback.status,
                headers: { "Content-Type": "application/json" },
            },
            authHeaders,
        );
    } catch {
        return authedResponse(
            JSON.stringify({ error: "upstream unreachable" }),
            { status: 502, headers: { "Content-Type": "application/json" } },
            authHeaders,
        );
    }
};
