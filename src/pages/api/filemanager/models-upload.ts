import type { APIRoute } from "astro";
import { getApiUrl } from "../../../lib/endpoint-config";
import { getBearerToken, unauthorized } from "./_auth";

export const POST: APIRoute = async ({ request }) => {
    const cookie = request.headers.get("cookie") ?? "";
    const token = await getBearerToken(cookie);
    if (!token) return unauthorized();

    let fileBuffer: ArrayBuffer;
    let fileName = "upload.glb";
    let contentType = "application/octet-stream";

    const reqContentType = request.headers.get("content-type") ?? "";
    if (reqContentType.includes("multipart/form-data")) {
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return new Response(JSON.stringify({ error: "invalid form data" }), { status: 400 });
        }
        const fileEntry = formData.get("file");
        if (!(fileEntry instanceof File)) {
            return new Response(JSON.stringify({ error: "file field required" }), { status: 400 });
        }
        fileBuffer = await fileEntry.arrayBuffer();
        fileName = fileEntry.name || fileName;
        contentType = fileEntry.type || contentType;
    } else {
        fileBuffer = await request.arrayBuffer();
        contentType = reqContentType || contentType;
    }

    const upstream = await fetch(`${getApiUrl()}/models`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
        body: fileBuffer,
    });
    const resBody = await upstream.text();
    return new Response(resBody, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
    });
};



