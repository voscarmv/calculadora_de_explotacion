import fs from 'fs';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const csvData = fs.readFileSync(join(__dirname, '..', 'rama2.csv'), 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

const dict = {};

let totalSalario = 0;
let totalOperacion = 0;
let totalImpuestos = 0;
let totalPlusvalia = 0;
let count = 0;

parsed.data.forEach(row => {
  if (row.NOMBRE_RAMA && row.HRS_SALARIO) {
    const salario = parseFloat(row.HRS_SALARIO);
    const operacion = parseFloat(row.HRS_OPERACION);
    const impuestos = parseFloat(row.HRS_IMPUESTOS_Y_FINANZAS);
    const plusvalia = parseFloat(row.HRS_PLUSVALIA_PURA);

    if (!isNaN(salario) && !isNaN(operacion) && !isNaN(impuestos) && !isNaN(plusvalia)) {
      totalSalario += salario;
      totalOperacion += operacion;
      totalImpuestos += impuestos;
      totalPlusvalia += plusvalia;
      count++;
    }

    dict[row.NOMBRE_RAMA] = {
      HRS_PARA_SALARIO: salario,
      HRS_OPERACION: operacion,
      HRS_IMPUESTOS: impuestos,
      HRS_PLUSVALIA_NETA: plusvalia,
      TASA_EXPLOTACION: row.CUOTA_PLUSVALIA
    };
  }
});

const avgSalario = count > 0 ? totalSalario / count : 2.5;
const avgOperacion = count > 0 ? totalOperacion / count : 0.5;
const avgImpuestos = count > 0 ? totalImpuestos / count : 0.5;
const avgPlusvalia = count > 0 ? totalPlusvalia / count : 4.5;
const tasaExplotacion = count > 0 ? ((avgPlusvalia / avgSalario) * 100).toFixed(2) + "%" : "200%";

dict["_GLOBAL_"] = {
  HRS_PARA_SALARIO: parseFloat(avgSalario.toFixed(2)),
  HRS_OPERACION: parseFloat(avgOperacion.toFixed(2)),
  HRS_IMPUESTOS: parseFloat(avgImpuestos.toFixed(2)),
  HRS_PLUSVALIA_NETA: parseFloat(avgPlusvalia.toFixed(2)),
  TASA_EXPLOTACION: tasaExplotacion
};

const outPath = join(__dirname, '..', 'public', 'datos.json');
fs.writeFileSync(outPath, JSON.stringify(dict));
console.log('datos.json creado en public/');
