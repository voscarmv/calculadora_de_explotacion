import fs from 'fs';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const csvData = fs.readFileSync(join(__dirname, '..', 'rama2.csv'), 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

const dict = {};

// Default global averages in case we cant find one or user skips
const globales = {
  HRS_PARA_SALARIO: 2.5,
  HRS_OPERACION: 0.5,
  HRS_IMPUESTOS: 0.5,
  HRS_PLUSVALIA_NETA: 4.5,
  TASA_EXPLOTACION: "200%"
};

parsed.data.forEach(row => {
  if (row.NOMBRE_RAMA && row.HRS_SALARIO) {
    dict[row.NOMBRE_RAMA] = {
      HRS_PARA_SALARIO: parseFloat(row.HRS_SALARIO),
      HRS_OPERACION: parseFloat(row.HRS_OPERACION),
      HRS_IMPUESTOS: parseFloat(row.HRS_IMPUESTOS_Y_FINANZAS),
      HRS_PLUSVALIA_NETA: parseFloat(row.HRS_PLUSVALIA_PURA),
      TASA_EXPLOTACION: row.CUOTA_PLUSVALIA
    };
  }
});

dict["_GLOBAL_"] = globales;

const outPath = join(__dirname, '..', 'public', 'datos.json');
fs.writeFileSync(outPath, JSON.stringify(dict));
console.log('datos.json creado en public/');
