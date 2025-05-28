document.addEventListener('DOMContentLoaded', () => {
    const blueprintInput = document.getElementById('blueprintInput');
    const analyzeButton = document.getElementById('analyzeButton');
    const statusDiv = document.getElementById('status');
    const imageLinkContainer = document.getElementById('imageLinkContainer');
    const uploadedImageUrlInput = document.getElementById('uploadedImageUrl');
    const copyLinkButton = document.getElementById('copyLinkButton');

    // Function to update status messages
    function updateStatus(message, type = '') {
        statusDiv.textContent = message;
        statusDiv.className = '';
        statusDiv.classList.add(type);
        statusDiv.style.display = 'block';
    }

    // Function to clear status and result
    function clearResults() {
        statusDiv.style.display = 'none';
        imageLinkContainer.style.display = 'none';
        uploadedImageUrlInput.value = '';
    }

    // Copy link to clipboard
    copyLinkButton.addEventListener('click', () => {
        uploadedImageUrlInput.select();
        uploadedImageUrlInput.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(uploadedImageUrlInput.value)
            .then(() => {
                alert('Link copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy link. Please copy manually.');
            });
    });

    analyzeButton.addEventListener('click', async () => {
        const file = blueprintInput.files[0];
        if (!file) {
            updateStatus('Please select an image file first.', 'error');
            return;
        }

        clearResults();
        updateStatus('Initiating upload process...', 'loading');
        analyzeButton.disabled = true;

        try {
            const getUploadInfoResponse = await fetch('/api/getUploadInfo');
            if (!getUploadInfoResponse.ok) {
                const errorData = await getUploadInfoResponse.json();
                throw new Error(errorData.error || 'Failed to get upload info from API.');
            }
            const uploadInfo = await getUploadInfoResponse.json();
            const imgbbUploadUrl = uploadInfo.upload_url;
            const imgbbApiKey = uploadInfo.api_key;

            updateStatus('Uploading image to ImgBB...', 'loading');

            const formData = new FormData();
            formData.append('key', imgbbApiKey);
            formData.append('image', file);

            const imgbbResponse = await fetch(imgbbUploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!imgbbResponse.ok) {
                const errorText = await imgbbResponse.text();
                throw new Error(`Failed to upload to ImgBB: ${errorText}`);
            }
            const imgbbResult = await imgbbResponse.json();

            if (imgbbResult.data && imgbbResult.data.url) {
                const imgbbImageUrl = imgbbResult.data.url;
                
                uploadedImageUrlInput.value = imgbbImageUrl;
                imageLinkContainer.style.display = 'block';
                
                updateStatus('Image uploaded to ImgBB. Now, copy the link above and paste it to your AI Agent', 'done');
            } else {
                throw new Error('ImgBB did not return a valid image URL.');
            }

        } catch (error) {
            console.error('Error during analysis:', error);
            updateStatus(`Error: ${error.message}`, 'error');
        } finally {
            analyzeButton.disabled = false;
        }
    });
});