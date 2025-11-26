const video = document.getElementById("video");
const result = document.getElementById("result");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        video.srcObject = stream;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        function scanLoop() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                overlay.width = video.videoWidth;
                overlay.height = video.videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, canvas.width, canvas.height);

                overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

                if (code) {
                    // Dibujar recuadro verde
                    drawBox(code.location);

                    // Mostrar resultado
                    result.textContent = code.data;
                    result.classList.add("detected");

                    setTimeout(() => result.classList.remove("detected"), 300);

                    navigator.clipboard.writeText(code.data).catch(() => {});
                }
            }

            requestAnimationFrame(scanLoop);
        }

        scanLoop();

    } catch (e) {
        result.textContent = "No se puede acceder a la camara";
        console.error(e);
    }
}

function drawBox(loc) {
    overlayCtx.strokeStyle = "#00e676";
    overlayCtx.lineWidth = 4;
    overlayCtx.beginPath();
    overlayCtx.moveTo(loc.topLeftCorner.x, loc.topLeftCorner.y);
    overlayCtx.lineTo(loc.topRightCorner.x, loc.topRightCorner.y);
    overlayCtx.lineTo(loc.bottomRightCorner.x, loc.bottomRightCorner.y);
    overlayCtx.lineTo(loc.bottomLeftCorner.x, loc.bottomLeftCorner.y);
    overlayCtx.closePath();
    overlayCtx.stroke();
}

startCamera();
