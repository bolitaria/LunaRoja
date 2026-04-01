const translationCache = new Map();

export async function translateText(text, sourceLang, targetLang) {
  if (sourceLang === targetLang || !text.trim()) return text;

  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const endpoint = `${apiUrl}/translate`;

  let attempts = 0;
  while (attempts < 2) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: 'text' })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const translated = data.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    } catch (error) {
      attempts++;
      if (attempts === 2) {
        console.error('Translation error after retries:', error);
        return text;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * attempts));
    }
  }
  return text;
}