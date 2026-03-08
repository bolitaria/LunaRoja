const axios = require('axios');
const { exec } = require('child_process');

// Lista de fuentes de proxies gratuitos (HTTP/HTTPS)
const PROXY_SOURCES = [
    'https://free-proxy-list.net/',
    'https://www.sslproxies.org/',
    'https://www.us-proxy.org/',
];

// Cache de proxies funcionales
let workingProxies = [];
let currentIndex = 0;
let lastUpdate = 0;

/**
 * Extrae proxies de una página HTML de free-proxy-list.net (formato tabla)
 */
function extractProxiesFromHTML(html) {
    const regex = /<tr><td>(\d+\.\d+\.\d+\.\d+)<\/td><td>(\d+)<\/td>/g;
    const proxies = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        proxies.push(`http://${match[1]}:${match[2]}`);
    }
    return proxies;
}

/**
 * Obtiene proxies de una fuente
 */
async function fetchProxiesFromSource(url) {
    try {
        const { data } = await axios.get(url, { timeout: 10000 });
        return extractProxiesFromHTML(data);
    } catch (error) {
        console.error(`Error obteniendo proxies de ${url}:`, error.message);
        return [];
    }
}

/**
 * Valida si un proxy funciona conectándose a Instagram
 */
async function validateProxy(proxyUrl) {
    // Usamos curl para probar la conexión (más rápido que Puppeteer)
    return new Promise((resolve) => {
        exec(`curl -x ${proxyUrl} -s -o /dev/null -w "%{http_code}" https://www.instagram.com/`, (error, stdout) => {
            if (error) return resolve(false);
            // Código 200 OK es éxito, otros códigos (301, 302) también pueden ser válidos
            const code = stdout.trim();
            resolve(code === '200' || code === '301' || code === '302');
        });
    });
}

/**
 * Actualiza la lista de proxies funcionales
 */
async function refreshProxyList() {
    console.log('Actualizando lista de proxies...');
    let allProxies = [];
    for (const source of PROXY_SOURCES) {
        const proxies = await fetchProxiesFromSource(source);
        allProxies.push(...proxies);
    }
    allProxies = [...new Set(allProxies)]; // eliminar duplicados
    console.log(`Obtenidos ${allProxies.length} proxies de fuentes. Validando...`);

    const validated = [];
    const batchSize = 10; // validar de 10 en 10 para no saturar
    for (let i = 0; i < allProxies.length; i += batchSize) {
        const batch = allProxies.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(p => validateProxy(p)));
        batch.forEach((proxy, idx) => {
            if (results[idx]) validated.push(proxy);
        });
        console.log(`Validados ${i + batch.length}/${allProxies.length}, encontrados ${validated.length} funcionales`);
    }

    workingProxies = validated;
    lastUpdate = Date.now();
    console.log(`✅ Proxies funcionales: ${workingProxies.length}`);
}

/**
 * Obtiene el siguiente proxy en la lista (round-robin)
 */
function getNextProxy() {
    if (workingProxies.length === 0) return null;
    const proxy = workingProxies[currentIndex];
    currentIndex = (currentIndex + 1) % workingProxies.length;
    return proxy;
}

/**
 * Inicia el actualizador periódico de proxies
 * @param {number} intervalMs Intervalo en milisegundos (por defecto 1 hora)
 */
function startProxyUpdater(intervalMs = 60 * 60 * 1000) {
    // Actualizar inmediatamente
    refreshProxyList().catch(console.error);
    // Programar actualizaciones periódicas
    setInterval(() => {
        refreshProxyList().catch(console.error);
    }, intervalMs);
}

module.exports = { getNextProxy, startProxyUpdater, refreshProxyList };