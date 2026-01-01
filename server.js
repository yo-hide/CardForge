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

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// AI Provider Switch: 'google' or 'openai'
const AI_PROVIDER = 'google';

app.post('/api/analyze-image', async (req, res) => {
    const { image, context } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided.' });

    try {
        console.log("Analyzing image on upload with GPT-4o...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: `この画像を分析し、特徴、構成、色使い、雰囲気を捉えた非常に詳細で芸術的な説明を【日本語】で作成してください。` },
                        { type: "image_url", image_url: { url: image } }
                    ],
                },
            ],
        });
        const analysis = response.choices[0].message.content;
        console.log("--- Initial Image Analysis (Japanese) ---");
        console.log(analysis);
        return res.json({ analysis });
    } catch (error) {
        console.error('Analysis Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate-image', async (req, res) => {
    const bodySize = JSON.stringify(req.body).length;
    console.log(`Request body size: ${(bodySize / 1024 / 1024).toFixed(2)} MB`);

    const { prompt, image } = req.body;

    if (AI_PROVIDER === 'google') {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Google API key is not configured.' });

        try {
            // In current hybrid flow, the prompt already contains the analysis result if an image was uploaded.
            // Google Imagen 4.0 will generate the final card based on this rich prompt.
            console.log("Generating card with Google Imagen 4.0 using the provided prompt...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "3:4"
                    }
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

            if (data.predictions && data.predictions[0]) {
                const base64Data = data.predictions[0].bytesBase64Encoded;
                const mimeType = data.predictions[0].mimeType || 'image/png';
                return res.json({
                    data: [{ url: `data:${mimeType};base64,${base64Data}` }]
                });
            }
            throw new Error('No image data received from Google.');
        } catch (error) {
            console.error('Google Proxy Error:', error);
            return res.status(500).json({ error: error.message });
        }
    } else if (AI_PROVIDER === 'openai') {
        if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI API key is not configured.' });

        try {
            // Using GPT-4o for image-to-image (DALL-E 3 doesn't support image input directly, but we use GPT-4o to describe and generate)
            // Or use DALL-E 2/3 for text-to-image. For TRUE image-to-image, some use Vision + DALL-E.
            // Since DALL-E 3 is superior, we'll use DALL-E 3 with a descriptive prompt if image exists.

            let finalPrompt = prompt;
            if (image) {
                console.log("Analyzing input image with GPT-4o to guide DALL-E 3...");
                const visionResponse = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: `Analyze this image and provide a highly detailed, artistic description that captures its composition, key subjects, colors, and atmosphere. This description will be used to generate a fantasy TCG card illustration. The core theme should be: ${prompt}` },
                                { type: "image_url", image_url: { url: image } }
                            ],
                        },
                    ],
                });
                finalPrompt = visionResponse.choices[0].message.content;
                console.log("Enhanced Prompt from Vision:", finalPrompt);
            }

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: finalPrompt,
                n: 1,
                size: "1024x1792",
                response_format: "b64_json"
            });

            const base64Data = response.data[0].b64_json;
            return res.json({ data: [{ url: `data:image/png;base64,${base64Data}` }] });
        } catch (error) {
            console.error('OpenAI Proxy Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
