const video = document.getElementById("video");
const resultText = document.getElementById("result");

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
}

startCamera();

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

function scanLoop() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
        result.textContent = code.data;
        navigator.clipboard.writeText(code.data).catch(() => {});
    }

    requestAnimationFrame(scanLoop);
}

requestAnimationFrame(scanLoop);
