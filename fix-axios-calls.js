const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'frontend', 'src', 'pages', 'admin');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) walk(fullPath, callback);
    else if (/\.(js|jsx)$/.test(f)) callback(fullPath);
  });
}

walk(adminDir, filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Eliminar líneas de token
  const tokenLineRegex = /^.*const\s+token\s*=\s*localStorage\.getItem\(['"]token['"]\);.*\r?\n?/gm;
  if (tokenLineRegex.test(content)) {
    content = content.replace(tokenLineRegex, '');
    modified = true;
  }

  // Reemplazar axios.get/delete con headers
  const axiosGetDelete = /axios\.(get|delete)\s*\(\s*`?\$\{apiUrl\s*\}\/([^`]*)`?\s*,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`\s*\}\s*\}\s*\)/g;
  content = content.replace(axiosGetDelete, (match, method, endpoint) => {
    modified = true;
    return `api.${method}('/${endpoint.trim()}')`;
  });

  // Reemplazar axios.post/put/patch con cuerpo y headers
  const axiosWithBody = /axios\.(post|put|patch)\s*\(\s*`?\$\{apiUrl\s*\}\/([^`]*)`?\s*,\s*(\{[\s\S]*?\}),\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer\s*\$\{token\}`[^}]*\}\s*\}\s*\)/g;
  content = content.replace(axiosWithBody, (match, method, endpoint, body) => {
    modified = true;
    return `api.${method}('/${endpoint.trim()}', ${body.trim()})`;
  });

  // Añadir import api si falta
  if (modified && !content.includes("import api from")) {
    const apiFile = path.join(__dirname, 'frontend', 'src', 'lib', 'axios');
    let relativePath = path.relative(path.dirname(filePath), apiFile).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
    const importStatement = `import api from '${relativePath}';\n`;
    const importRegex = /import\s+.*\n/g;
    const imports = content.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, `${lastImport}${importStatement}`);
    } else {
      content = importStatement + content;
    }
  }

  if (modified) fs.writeFileSync(filePath, content, 'utf8');
});

console.log('✅ Migración profunda completada.');
