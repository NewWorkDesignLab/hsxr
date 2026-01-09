import { kv } from '@vercel/kv';
export { renderers } from '../../renderers.mjs';

const QR_KEY = "qrcode";
const GET = async () => {
  try {
    const data = await kv.get(QR_KEY) ?? "";
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    return new Response("", { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
