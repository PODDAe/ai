// server.js
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Google AI Client
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Set up Multer for file upload (store files in memory for analysis)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for safety
});

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json());

// --- Helper Function ---
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// 1. General Chat / Code Generation Endpoint
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: "user", parts: [{ text: `Act as a professional software engineer and chatbot named DTZ NOVA AI BOT. Respond to this request, providing detailed code and explanations using markdown if needed: ${prompt}` }] }
            ]
        });
        res.json({ success: true, response: response.text });
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        res.status(500).json({ success: false, error: 'AI processing failed.' });
    }
});

// 2. Image Generation Endpoint
app.post('/api/image', async (req, res) => {
    const { prompt } = req.body;
    
    try {
        const result = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: "1:1"
            }
        });

        const imageBase64 = result.generatedImages[0].image.imageBytes;
        res.json({ success: true, image_data: imageBase64 });
    } catch (error) {
        console.error("Imagen Generation Error:", error);
        res.status(500).json({ success: false, error: 'Image generation failed.' });
    }
});

// 3. File Upload and Analysis Endpoint (Multimodal)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }
    
    try {
        const filePart = fileToGenerativePart(file.buffer, file.mimetype);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: "user", parts: [
                    filePart,
                    { text: `Analyze this uploaded file named "${file.originalname}" and provide a summary, key insights, or code analysis based on its content. Explain any potential issues.` }
                ]}
            ]
        });

        res.json({ success: true, response: response.text, filename: file.originalname });
    } catch (error) {
        console.error("Gemini File Analysis Error:", error);
        res.status(500).json({ success: false, error: 'File analysis failed.' });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`DTZ NOVA AI BOT Server running on port ${port}`);
});