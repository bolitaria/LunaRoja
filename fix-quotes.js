const fs = require('fs');
const path = require('path');

// Archivos y líneas problemáticas (nombre -> array de números de línea)
const fixes = {
  'frontend/src/pages/admin/actions/new.js': [400],
  'frontend/src/pages/admin/actions/[id]/edit.js': [466],
};

Object.entries(fixes).forEach(([filePath, lines]) => {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const linesArray = content.split('\n');

  lines.forEach((lineNum) => {
    const idx = lineNum - 1; // 0‑based
    if (linesArray[idx]) {
      // Reemplaza todas las comillas dobles que estén dentro del texto JSX
      // (entre '>' y '<') por &quot;
      const updatedLine = linesArray[idx].replace(
        /(>[^<]*)(")([^<]*<)/g,
        (match, before, quote, after) => before + '&quot;' + after
      );
      linesArray[idx] = updatedLine;
      console.log(`✓ ${filePath}:${lineNum} corregida`);
    }
  });

  fs.writeFileSync(fullPath, linesArray.join('\n'), 'utf8');
});

console.log('✔ Todos los arreglos aplicados.');