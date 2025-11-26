// public/script.js
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const uploadForm = document.getElementById('upload-form');

// Function to append a message to the chat interface
function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    let content = '';
    if (sender === 'user') {
        // User messages are just text
        content = `<strong>Dulina Nethmira:</strong> ${text}`;
    } else {
        content = `<strong>DTZ NOVA AI BOT:</strong>`;
        // Replace markdown code fences with <pre><code> for cyber styling
        const processedText = text.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || ''}">${code.trim()}</code></pre>`;
        });
        content += processedText;
    }

    messageDiv.innerHTML = `<p>${content}</p>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to append an image result
function appendImage(prompt, base64Data) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot');
    const imageHTML = `
        <p><strong>DTZ NOVA AI BOT:</strong> Generated image for prompt: <em>${prompt}</em></p>
        <img src="data:image/jpeg;base64,${base64Data}" alt="${prompt}" />
    `;
    messageDiv.innerHTML = imageHTML;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


// --- Chat/Code Generation Handler ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const promptInput = document.getElementById('user-prompt');
    const userPrompt = promptInput.value;
    if (!userPrompt.trim()) return;

    appendMessage('user', userPrompt);
    promptInput.value = '';

    let apiUrl = '/api/chat';
    let requestBody = { prompt: userPrompt };

    // Check for Image Generation command
    if (userPrompt.toLowerCase().startsWith('/generate image')) {
        apiUrl = '/api/image';
        requestBody.prompt = userPrompt.replace('/generate image', '').trim();
        appendMessage('bot', `// COMMAND DETECTED: Initializing image generation for: ${requestBody.prompt}`);
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();

        if (data.success) {
            if (apiUrl === '/api/image') {
                appendImage(requestBody.prompt, data.image_data);
            } else {
                appendMessage('bot', data.response);
            }
        } else {
            appendMessage('bot', `// ERROR CODE 500: AI processing failed. Message: ${data.error}`);
        }
    } catch (error) {
        appendMessage('bot', '// ERROR CODE 404: Network connection failed. Could not reach server.');
        console.error('Fetch error:', error);
    }
});


// --- File Upload Handler ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    if (!file) return;

    appendMessage('user', `UPLOAD REQUEST: File ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    appendMessage('bot', `// PROCESSING FILE: Initializing multimodal analysis...`);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            appendMessage('bot', `**FILE ANALYSIS COMPLETE** (${data.filename}): \n\n ${data.response}`);
        } else {
            appendMessage('bot', `// FILE ANALYSIS ERROR: ${data.error}`);
        }

    } catch (error) {
        appendMessage('bot', '// FILE UPLOAD ERROR: Failed to transfer file to server.');
        console.error('File upload fetch error:', error);
    }
});