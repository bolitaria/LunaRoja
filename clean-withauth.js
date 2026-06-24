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

  // Eliminar import de withAuth desde cualquier ruta
  if (content.includes('withAuth')) {
    content = content.replace(/import\s+\{\s*withAuth\s*\}\s+from\s+['"].*?['"];\s*\n?/g, '');
    // Quitar withAuth en export default
    content = content.replace(/export\s+default\s+withAuth\s*\(\s*(\w+)\s*\)/g, 'export default $1');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Limpiado withAuth en ${filePath}`);
  }
});

console.log('✅ Limpieza completada. Ya puedes reconstruir el frontend.');