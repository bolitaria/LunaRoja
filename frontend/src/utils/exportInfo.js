function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportAsCSV(data, headers, filename) {
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header].toString();
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

async function exportAsExcel(data, headers, filename) {
  const ExcelJS = await import('exceljs');  // Importación dinámica
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Datos');

  worksheet.addRow(headers);

  data.forEach(row => {
    const values = headers.map(h => row[h] ?? '');
    worksheet.addRow(values);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

function exportAsTXT(data, headers, filename) {
  const lines = [];
  lines.push(headers.join('\t'));
  for (const row of data) {
    const values = headers.map(h => row[h] ?? '');
    lines.push(values.join('\t'));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportInfo(data, headers, filename, format = 'csv') {
  const fullFilename = `${filename}.${format === 'xlsx' ? 'xlsx' : format === 'txt' ? 'txt' : 'csv'}`;
  
  switch (format) {
    case 'xlsx':
      exportAsExcel(data, headers, fullFilename);
      break;
    case 'txt':
      exportAsTXT(data, headers, fullFilename);
      break;
    case 'csv':
    default:
      exportAsCSV(data, headers, fullFilename);
      break;
  }
}

// Mantenemos compatibilidad hacia atrás
export function downloadCSV(data, headers, filename = 'data.csv') {
  exportInfo(data, headers, filename.replace('.csv', ''), 'csv');
}