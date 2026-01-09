import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';

const QR_KEY = 'qrcode';

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const data = formData.get('data')?.toString() ?? '';

        if (!data) {
            return new Response('No data received', { status: 400 });
        }

        await kv.set(QR_KEY, data);

        return new Response('OK', {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error) {
        return new Response('Server error', { status: 500 });
    }
};

export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
};
