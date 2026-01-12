declare const QRCode: any;

const QR_DATA_URL = 'https://00224466.xyz/mues/getqrdata.php';

const qrElem = document.getElementById("qrcode");
const roomCodeElem = document.getElementById("code");
let lastToken: string | null = null;
let lastModified: string | null = null;
let controller: AbortController | null = null;

// Loading-Spinner beim Start anzeigen
if (qrElem) {
    qrElem.innerHTML = '<div class="qr-loading"></div>';
}

async function updateQr() {
    if (controller) {
        controller.abort();
    }
    controller = new AbortController();

    try {
        let url = QR_DATA_URL;
        if (lastModified) {
            url += (url.includes('?') ? '&' : '?') + 'since=' + encodeURIComponent(lastModified);
        }

        const resp = await fetch(url, {
            cache: 'no-store',
            signal: controller.signal
        });

        if (resp.status === 204) {
            return;
        }

        if (resp.ok) {
            const lm = resp.headers.get('Last-Modified');
            if (lm) {
                lastModified = lm;
            }

            const token = (await resp.text()).trim();

            if (token && token !== lastToken) {
                lastToken = token;

                if (qrElem) {
                    qrElem.innerHTML = "";
                    new QRCode(qrElem, { text: token, width: 550, height: 550 });
                }

                if (roomCodeElem) {
                    const match = token.match(/hsxrJoin_(\w+)/);
                    roomCodeElem.textContent = match ? match[1] : token;
                }
            }
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
            console.error('Error fetching QR code:', e);
        }
    }
}

setInterval(updateQr, 1000);
updateQr();
