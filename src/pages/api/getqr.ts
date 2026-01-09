import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';

const QR_KEY = 'qrcode';

export const GET: APIRoute = async () => {
    try {
        const data = await kv.get<string>(QR_KEY) ?? '';

        return new Response(data, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        });
    } catch (error) {
        return new Response('', { status: 500 });
    }
};

