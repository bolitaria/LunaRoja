const express = require('express');
const axios = require('axios');
const router = express.Router();

// Use the Docker service name or an environment variable
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://libretranslate:5000';

router.post('/', async (req, res) => {
  const { q, source, target, format } = req.body;
  if (!q) {
    return res.status(400).json({ error: 'Missing text to translate' });
  }
  try {
    const response = await axios.post(`${LIBRETRANSLATE_URL}/translate`, {
      q,
      source: source || 'es',
      target: target || 'en',
      format: format || 'text'
    }, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Translation error:', error.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;