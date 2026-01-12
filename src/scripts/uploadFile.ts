const configElement = document.getElementById('uploadConfig') as HTMLElement;
const MAX_FILE_SIZE_MB = parseInt(configElement?.dataset.maxSize || '50', 10);
const UPLOAD_ENDPOINT = configElement?.dataset.endpoint || '';

const dropzone = document.getElementById('dropzone')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const fileInfo = document.getElementById('fileInfo')!;
const fileName = document.getElementById('fileName')!;
const fileSize = document.getElementById('fileSize')!;
const removeFile = document.getElementById('removeFile')!;
const uploadCode = document.getElementById('uploadCode') as HTMLInputElement;
const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;
const uploadBtnText = document.getElementById('uploadBtnText')!;
const uploadSpinner = document.getElementById('uploadSpinner')!;
const statusMessage = document.getElementById('statusMessage')!;
const progressContainer = document.getElementById('progressContainer')!;
const progressBar = document.getElementById('progressBar') as HTMLElement;
const progressText = document.getElementById('progressText')!;

let selectedFile: File | null = null;
const MAX_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
        dropzone.classList.add('dragover');
    });
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
        dropzone.classList.remove('dragover');
    });
});

dropzone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
removeFile.addEventListener('click', clearFile);
uploadCode.addEventListener('input', checkUploadReady);
uploadBtn.addEventListener('click', handleUpload);

function handleDrop(e: Event): void {
    const dragEvent = e as DragEvent;
    const files = dragEvent.dataTransfer?.files;
    if (files && files.length > 0) {
        validateAndSetFile(files[0]);
    }
}

function handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        validateAndSetFile(target.files[0]);
    }
}

function validateAndSetFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.glb')) {
        showStatus('Only .glb files are allowed!', 'error');
        return;
    }

    if (file.size > MAX_SIZE_BYTES) {
        showStatus(`File is too large! Maximum: ${MAX_FILE_SIZE_MB} MB`, 'error');
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.remove('hidden');
    dropzone.classList.add('has-file');
    hideStatus();
    checkUploadReady();
}

function clearFile(): void {
    selectedFile = null;
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    dropzone.classList.remove('has-file');
    checkUploadReady();
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function checkUploadReady(): void {
    uploadBtn.disabled = !(selectedFile && uploadCode.value.trim().length > 0);
}

function showStatus(message: string, type: 'success' | 'error'): void {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
}

function hideStatus(): void {
    statusMessage.classList.add('hidden');
}

async function handleUpload(): Promise<void> {
    if (!selectedFile || !uploadCode.value.trim()) return;

    uploadBtn.disabled = true;
    uploadBtnText.textContent = 'Uploading...';
    uploadSpinner.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    hideStatus();

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('code', uploadCode.value.trim());


    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = percent + '%';
            }
        });

        xhr.addEventListener('load', () => {

            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        showStatus('Upload successful! ✓', 'success');
                        clearFile();
                        uploadCode.value = '';
                    } else {
                        showStatus(response.message || 'Upload failed', 'error');
                    }
                } catch {
                    showStatus('Upload successful!', 'success');
                    clearFile();
                    uploadCode.value = '';
                }
            } else {
                try {
                    const response = JSON.parse(xhr.responseText);
                    showStatus(response.message || 'Error: ' + xhr.status, 'error');
                } catch {
                    showStatus('Server error: ' + xhr.status, 'error');
                }
            }
            resetUploadUI();
        });

        xhr.addEventListener('error', () => {
            showStatus('Network error during upload', 'error');
            resetUploadUI();
        });

        xhr.open('POST', UPLOAD_ENDPOINT);
        xhr.send(formData);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showStatus('Error: ' + errorMessage, 'error');
        resetUploadUI();
    }
}

function resetUploadUI(): void {
    uploadBtn.disabled = false;
    uploadBtnText.textContent = 'Upload';
    uploadSpinner.classList.add('hidden');
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    }, 1000);
    checkUploadReady();
}