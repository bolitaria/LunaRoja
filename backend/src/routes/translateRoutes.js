const express = require('express');
const axios = require('axios');
const router = express.Router();

// Dirección interna del contenedor de traducción (nombre del servicio en Docker)
const LIBRETRANSLATE_URL = 'http://lunaroja_libretranslate:5000';

router.post('/', async (req, res) => {
  const { q, source, target, format } = req.body;
  if (!q) return res.status(400).json({ error: 'Missing text to translate' });
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