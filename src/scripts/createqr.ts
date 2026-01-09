declare const QRCode: any;

const QR_DATA_URL = 'https://00224466.xyz/mues/qrdata.txt';

const qrElem = document.getElementById("qrcode");
const roomCodeElem = document.getElementById("roomcode");
let lastToken: string | null = null;

async function updateQr() {
    try {
        const resp = await fetch(QR_DATA_URL, {
            cache: 'no-store'
        });

        if (!resp.ok) return;
        const token = (await resp.text()).trim();

        if (!token || token === lastToken) return;
        lastToken = token;

        if (qrElem) {
            qrElem.innerHTML = "";
            new QRCode(qrElem, { text: token, width: 512, height: 512 });
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
setInterval(updateQr, 1000);
