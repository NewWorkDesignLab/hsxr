import { kv } from '@vercel/kv';
export { renderers } from '../../renderers.mjs';

const QR_KEY = "qrcode";
const POST = async ({ request }) => {
  try {
    const formData = await request.formData();
    const data = formData.get("data")?.toString() ?? "";
    if (!data) {
      return new Response("No data received", { status: 400 });
    }
    await kv.set(QR_KEY, data);
    return new Response("OK", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response("Server error", { status: 500 });
  }
};
const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    OPTIONS,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
