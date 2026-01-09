declare const QRCode: any;

const JSONBIN_BIN_ID = '696126c943b1c97be9249c4a';
const ACCESS_KEY = '$2a$10$dR8nsxSUDtw3qkMcOhkv1.dET7DYI6q0tAbtEamzAPIQ0Mbu60kOW';

const qrElem = document.getElementById("qrcode");
const roomCodeElem = document.getElementById("roomcode");
let lastToken: string | null = null;

async function updateQr() {
    try {
        const resp = await fetch(
            `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`,
            { headers: {
                "X-Bin-Meta": "false",
                "X-Access-Key": ACCESS_KEY
            }}
        );

        if (!resp.ok) return;
        const data = await resp.json();
        const token = data.qrcode?.trim();

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