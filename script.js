document.addEventListener('DOMContentLoaded', () => {
    const blueprintInput = document.getElementById('blueprintInput');
    const analyzeButton = document.getElementById('analyzeButton');
    const statusDiv = document.getElementById('status');
    const imageLinkContainer = document.getElementById('imageLinkContainer');
    const uploadedImageUrlInput = document.getElementById('uploadedImageUrl');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const backendApiUrl = window.BACKEND_API_URL;

    const projectUpvoteButton = document.getElementById('projectUpvoteButton');
    const projectUpvoteCountDiv = document.getElementById('projectUpvoteCount');
    const memeImage = document.getElementById('memeImage');
    const loadMemeButton = document.getElementById('loadMemeButton');
    const memeUpvoteButton = document.getElementById('memeUpvoteButton');
    const memeUpvoteCountDiv = document.getElementById('memeUpvoteCount');

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
            const getUploadInfoResponse = await fetch(backendApiUrl + '/api/getUploadInfo');
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
                const imgbbImageUrl = encodeURIComponent(imgbbResult.data.url);
                
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

    // Function to fetch and display upvote counts
    async function fetchUpvoteCounts() {
        try {

            const projectResponse = await fetch(backendApiUrl + '/api/upvoteProject');
            if (projectResponse.ok) {
                const data = await projectResponse.json();
                projectUpvoteCountDiv.textContent = `Upvotes: ${data.count}`;
            } else {
                console.error('Failed to fetch project upvotes:', await projectResponse.text());
                projectUpvoteCountDiv.textContent = 'Upvotes: Error';
            }


            const memeResponse = await fetch(backendApiUrl + '/api/upvoteMeme');
            if (memeResponse.ok) {
                const data = await memeResponse.json();
                memeUpvoteCountDiv.textContent = `Meme Upvotes: ${data.count}`;
            } else {
                console.error('Failed to fetch meme upvotes:', await memeResponse.text());
                memeUpvoteCountDiv.textContent = 'Meme Upvotes: Error';
            }

        } catch (error) {
            console.error('Error fetching upvote counts:', error);
            projectUpvoteCountDiv.textContent = 'Upvotes: Error';
            memeUpvoteCountDiv.textContent = 'Meme Upvotes: Error';
        }
    }

    // Function to increment upvote
    async function incrementUpvote(type) {
        try {
            const response = await fetch(backendApiUrl + `/api/upvote${type.charAt(0).toUpperCase() + type.slice(1)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                const data = await response.json();
                if (type === 'project') {
                    projectUpvoteCountDiv.textContent = `Upvotes: ${data.newCount}`;
                    alert('Project upvoted! Thank you!');
                } else if (type === 'meme') {
                    memeUpvoteCountDiv.textContent = `Meme Upvotes: ${data.newCount}`;
                    alert('Meme game upvoted! Thanks for the laugh!');
                }
            } else {
                console.error(`Failed to upvote ${type}:`, await response.text());
                alert(`Failed to upvote ${type}. Please try again.`);
            }
        } catch (error) {
            console.error(`Error upvoting ${type}:`, error);
            alert(`An error occurred while upvoting ${type}.`);
        }
    }

    // Function to load a random meme image
    async function loadRandomMeme() {
        try {
            const response = await fetch('https://meme-api.com/gimme');
            if (!response.ok) {
                throw new Error('Failed to fetch meme.');
            }
            const data = await response.json();
            if (data && data.url) {
                memeImage.src = data.url;
                memeImage.style.display = 'block';
                memeImage.alt = data.title || 'Random Meme';
            } else {
                throw new Error('Meme API did not return a valid image URL.');
            }
        } catch (error) {
            console.error('Error loading meme:', error);
            memeImage.style.display = 'none';
            alert('Failed to load a random meme. Please try again.');
        }
    }

    projectUpvoteButton.addEventListener('click', () => incrementUpvote('project'));
    memeUpvoteButton.addEventListener('click', () => incrementUpvote('meme'));
    loadMemeButton.addEventListener('click', loadRandomMeme);

    fetchUpvoteCounts();
    loadRandomMeme();

});