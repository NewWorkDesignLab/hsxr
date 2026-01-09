declare const QRCode: any;

const GIST_ID = '4591e435339250a41cf1a0ff88235516';
const GIST_FILENAME = 'qrcode.txt';

const qrElem = document.getElementById("qrcode");
const roomCodeElem = document.getElementById("roomcode");
let lastToken: string | null = null;

async function updateQr() {
    try {
        const resp = await fetch(
            `https://gist.githubusercontent.com/raw/${GIST_ID}/${GIST_FILENAME}?nocache=${Date.now()}`
        );

        if (!resp.ok) return;
        const token = (await resp.text()).trim();

        if (!token || token === lastToken) return;

        lastToken = token;

        if (qrElem) {
            qrElem.innerHTML = "";
            new QRCode(qrElem, {
                text: token,
                width: 512,
                height: 512
            });
        }

        if (roomCodeElem) {
            const match = token.match(/hsxrJoin_(\w+)/);
            roomCodeElem.textContent = match ? match[1] : token;
        }
    } catch (e) {
        console.error('Error fetching QR code:', e);
    }
}

updateQr();
setInterval(updateQr, 3000);
