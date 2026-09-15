import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const app = express();
const PORT = process.env.AI_API_PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

config({ path: envPath });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const STABILITY_API_KEY = process.env.AI_IMAGE_API_KEY;
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';

if (!STABILITY_API_KEY) {
  console.warn('[server] AI_IMAGE_API_KEY is not set. Generative fill will fail until it is configured.');
} else {
  console.log(`[server] AI_IMAGE_API_KEY loaded: yes`);
  console.log(`[server] AI_IMAGE_API_KEY length: ${STABILITY_API_KEY.length}`);
}

app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.AI_IMAGE_API_KEY);
  res.json({
    status: hasKey ? 'ready' : 'missing-key',
    hasKey,
    keyLength: process.env.AI_IMAGE_API_KEY ? process.env.AI_IMAGE_API_KEY.length : 0,
  });
});

app.post('/api/generative-fill', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask', maxCount: 1 },
]), async (req, res) => {
  try {
    if (!STABILITY_API_KEY) {
      return res.status(500).json({ error: 'AI_IMAGE_API_KEY is not configured on the server.' });
    }

    const imageFile = req.files?.image?.[0];
    const maskFile = req.files?.mask?.[0];
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';

    console.log(`[server] Received generative fill request: prompt="${prompt.slice(0, 80)}", imageSize=${imageFile?.size}, maskSize=${maskFile?.size}`);

    if (!imageFile) {
      return res.status(400).json({ error: 'Missing image file.' });
    }
    if (!maskFile) {
      return res.status(400).json({ error: 'Missing mask file.' });
    }
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt.' });
    }

    const form = new FormData();
    form.append('image', imageFile.buffer, {
      filename: 'image.png',
      contentType: imageFile.mimetype || 'image/png',
    });
    form.append('mask', maskFile.buffer, {
      filename: 'mask.png',
      contentType: maskFile.mimetype || 'image/png',
    });
    form.append('prompt', prompt);
    form.append('output_format', 'png');
    form.append('strength', 0.75);

    console.log(`[server] Sending to Stability AI: prompt="${prompt.slice(0, 80)}" imageType=${imageFile.mimetype} maskType=${maskFile.mimetype} imageBytes=${imageFile.buffer.length} maskBytes=${maskFile.buffer.length}`);

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    console.log(`[server] Stability AI response status: ${response.status}`);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('[server] Stability AI error body:', responseText.slice(0, 1000));
      let errorMessage = `Stability AI API error: ${response.status} ${response.statusText}`;
      try {
        const json = JSON.parse(responseText);
        errorMessage = json?.message || json?.error?.message || json?.errors?.join(', ') || errorMessage;
      } catch {
        if (responseText) errorMessage = responseText.slice(0, 500);
      }
      return res.status(502).json({ error: errorMessage });
    }

    const buffer = Buffer.from(responseText);
    console.log(`[server] Stability AI returned image: ${buffer.length} bytes`);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('[server] Generative fill error:', err);
    return res.status(500).json({ error: err?.message || 'Unexpected server error during generation.' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Generative fill API listening on http://localhost:${PORT}`);
});
