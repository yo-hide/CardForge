require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, './')));

// Proxy endpoint for Google Imagen 3 image generation
app.post('/api/generate-image', async (req, res) => {
    // Log body size for debugging
    const bodySize = JSON.stringify(req.body).length;
    console.log(`Request body size: ${(bodySize / 1024 / 1024).toFixed(2)} MB`);

    const { prompt, image } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Google API key is not configured on the server.' });
    }

    try {
        // Using Google AI Studio (Gemini API) Imagen 4.0 endpoint
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

        const instance = { prompt: prompt };

        // If an image is provided, include it in the instance for image-to-image
        if (image && image.includes('base64,')) {
            const base64Data = image.split('base64,').pop();
            instance.image = {
                bytesBase64Encoded: base64Data
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instances: [instance],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            })
        });

        const data = await response.json();

        // Log the full API response for debugging
        console.log('Google API Response:', JSON.stringify(data, null, 2));

        if (data.error) {
            const errorMessage = data.error.message || (typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
            console.error('Google API Error:', errorMessage);

            // If model not found, try to list available models to console for debugging
            if (response.status === 404 || errorMessage.includes('not found')) {
                try {
                    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                    const listRes = await fetch(listUrl);
                    const listData = await listRes.json();
                    console.log('--- Available Models ---');
                    if (listData.models) {
                        listData.models.forEach(m => console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods})`));
                    } else {
                        console.log('Could not retrieve model list:', JSON.stringify(listData));
                    }
                    console.log('-------------------------');
                } catch (listErr) {
                    console.error('Failed to list models:', listErr);
                }
            }

            throw new Error(`Google API Error: ${errorMessage}`);
        }

        // Google returns base64 in predictions[0].bytesBase64Encoded
        if (data.predictions && data.predictions[0]) {
            const base64Data = data.predictions[0].bytesBase64Encoded;
            const mimeType = data.predictions[0].mimeType || 'image/png';

            // Return in a format compatible with our frontend logic or just base64
            // Our current frontend expects: { data: [{ url: "..." }] } (OpenAI style)
            // We can convert base64 to a Data URL for the frontend
            const dataUrl = `data:${mimeType};base64,${base64Data}`;

            res.json({
                data: [
                    { url: dataUrl }
                ]
            });
        } else {
            res.status(500).json({ error: 'No image data received from Google API.' });
        }
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate image due to server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
