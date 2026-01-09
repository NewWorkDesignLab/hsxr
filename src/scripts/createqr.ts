declare const QRCode: any;

const qrElem = document.getElementById("qrcode");
let lastToken: string | null = null;

async function updateQr() {
    try {
        const resp = await fetch("/api/getqr?nocache=" + Date.now());
        if (!resp.ok) return;

        const raw = await resp.text();
        const token = raw.trim();
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
    } catch (e) {}
}

updateQr();
setInterval(updateQr, 2000);