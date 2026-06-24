const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'frontend', 'src', 'pages', 'admin');
const apiModulePath = path.join(__dirname, 'frontend', 'src', 'lib', 'axios');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (/\.(js|jsx)$/.test(f)) {
      callback(fullPath);
    }
  });
}

walk(adminDir, filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Eliminar solo la línea exacta que define token desde localStorage
  if (/const\s+token\s*=\s*localStorage\.getItem\(['"]token['"]\);/.test(content)) {
    content = content.replace(/const\s+token\s*=\s*localStorage\.getItem\(['"]token['"]\);\s*\n?/g, '');
    modified = true;
    console.log(`[DEL] token line in ${filePath}`);
  }

  // 2. Reemplazar axios.get/delete con headers por api.get/delete
  //    Solo actúa si la línea contiene exactamente axios.get/delete y { headers: { Authorization: `Bearer ${token}` } }
  const axiosGetDeleteRegex = /axios\.(get|delete)\s*\(\s*`\$\{process\.env\.NEXT_PUBLIC_API_URL\}([^`]+)`\s*,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*\}\s*\)/g;
  content = content.replace(axiosGetDeleteRegex, (match, method, endpoint) => {
    modified = true;
    // Asegurar que el endpoint no tenga espacios extraños
    const cleanEndpoint = endpoint.trim().replace(/\/$/, '');
    return `api.${method}('${cleanEndpoint}')`;
  });

  // 3. Reemplazar axios.post/put/patch con headers y cuerpo
  //    Solo líneas que contengan { headers: { Authorization: `Bearer ${token}` } } como último argumento
  const axiosWithBodyRegex = /axios\.(post|put|patch)\s*\(\s*`\$\{process\.env\.NEXT_PUBLIC_API_URL\}([^`]+)`\s*,\s*(\{[\s\S]*?\})\s*,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*\}\s*\)/g;
  content = content.replace(axiosWithBodyRegex, (match, method, endpoint, body) => {
    modified = true;
    const cleanEndpoint = endpoint.trim().replace(/\/$/, '');
    return `api.${method}('${cleanEndpoint}', ${body.trim()})`;
  });

  // 4. Añadir import api si se hicieron cambios y no existe
  if (modified && !content.includes("import api from")) {
    const relativePath = path.relative(path.dirname(filePath), apiModulePath).replace(/\\/g, '/');
    const importLine = `import api from '${relativePath}';\n`;
    // Insertar después del último import
    const importRegex = /^import\s+.*\n/gm;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, `${lastImport}${importLine}`);
    } else {
      content = importLine + content;
    }
    console.log(`[ADD] import api in ${filePath}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Migrated ${filePath}`);
  }
});

console.log('✅ Safe migration completed. Rebuild frontend: docker-compose up -d --build frontend');