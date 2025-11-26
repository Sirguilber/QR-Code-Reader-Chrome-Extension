const video = document.getElementById("video");
const result = document.getElementById("result");

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        video.srcObject = stream;

        const canvas = document.createElement("canvas");

        // ESTE ES EL CONTEXTO CORRECTO
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        function scanLoop() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    result.textContent = code.data;
                    navigator.clipboard.writeText(code.data).catch(() => {});
                }
            }

            requestAnimationFrame(scanLoop);
        }

        scanLoop();

    } catch (e) {
        result.textContent = "Error al acceder a la cámara";
        console.error(e);
    }
}

startCamera();
