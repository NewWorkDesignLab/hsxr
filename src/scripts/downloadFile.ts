const downloadConfigElement = document.getElementById('uploadConfig') as HTMLElement;
const MODELS_BASE_URL = downloadConfigElement?.dataset.modelsUrl || 'https://00224466.xyz/models/';

const modelNameInput = document.getElementById('modelName') as HTMLInputElement;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
const downloadBtnText = document.getElementById('downloadBtnText')!;
const downloadSpinner = document.getElementById('downloadSpinner')!;
const downloadStatus = document.getElementById('downloadStatus')!;

modelNameInput.addEventListener('input', checkDownloadReady);
apiKeyInput.addEventListener('input', checkDownloadReady);
downloadBtn.addEventListener('click', handleDownload);

function checkDownloadReady(): void {
    const modelName = modelNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    downloadBtn.disabled = !(modelName.length > 0 && apiKey.length > 0);
}

function showDownloadStatus(message: string, type: 'success' | 'error'): void {
    downloadStatus.textContent = message;
    downloadStatus.className = `status-message ${type}`;
    downloadStatus.classList.remove('hidden');
}

function hideDownloadStatus(): void {
    downloadStatus.classList.add('hidden');
}

async function handleDownload(): Promise<void> {
    const modelName = modelNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!modelName || !apiKey) return;

    let fileName = modelName;
    if (!fileName.toLowerCase().endsWith('.glb')) {
        fileName += '.glb';
    }

    downloadBtn.disabled = true;
    downloadBtnText.textContent = 'Downloading...';
    downloadSpinner.classList.remove('hidden');
    hideDownloadStatus();

    const downloadUrl = `${MODELS_BASE_URL}${encodeURIComponent(fileName)}?api_key=${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(downloadUrl);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showDownloadStatus('Invalid API key', 'error');
            } else if (response.status === 404) {
                showDownloadStatus('Model not found', 'error');
            } else {
                showDownloadStatus(`Error: ${response.status}`, 'error');
            }
            resetDownloadUI();
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showDownloadStatus('Download started! ✓', 'success');
        modelNameInput.value = '';
        apiKeyInput.value = '';
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showDownloadStatus('Network error: ' + errorMessage, 'error');
    }

    resetDownloadUI();
}

function resetDownloadUI(): void {
    downloadBtn.disabled = false;
    downloadBtnText.textContent = 'Download';
    downloadSpinner.classList.add('hidden');
    checkDownloadReady();
}

