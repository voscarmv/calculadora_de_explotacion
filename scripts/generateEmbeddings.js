import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the local caching isn't breaking in CI/CD by keeping models in a known dir
env.cacheDir = join(__dirname, '..', '.cache');

async function generate() {
  console.log('Cargando el modelo de embeddings...');
  // Usamos el modelo multilingüe para mejor soporte de español
  const extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
  
  console.log('Leyendo datos_rama.csv...');
  const csvData = fs.readFileSync(join(__dirname, '..', 'datos_rama.csv'), 'utf8');
  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  
  // Extraer las ramas unicas (columna NOMBRE_RAMA)
  const ramasUnicas = Array.from(new Set(parsed.data.map(row => row['NOMBRE_RAMA']).filter(Boolean)));
  // Filter out any undefined or empty strings
  const ramas = ramasUnicas.filter(r => r && r.trim() !== '');

  console.log(`Generando embeddings para ${ramas.length} ramas...`);
  
  const embeddings = [];
  for (let i = 0; i < ramas.length; i++) {
    const rama = ramas[i];
    const output = await extractor(rama, { pooling: 'mean', normalize: true });
    embeddings.push({ 
      rama, 
      vector: Array.from(output.data) 
    });
    if ((i + 1) % 10 === 0) console.log(`Procesado ${i + 1}/${ramas.length}`);
  }
  
  const outPath = join(__dirname, '..', 'public', 'embeddings.json');
  fs.writeFileSync(outPath, JSON.stringify(embeddings));
  console.log('Embeddings guardados exitosamente en:', outPath);
}

generate().catch(err => {
  console.error('Error generando embeddings:', err);
  process.exit(1);
});
