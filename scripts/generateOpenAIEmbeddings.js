import fs from 'fs';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env o .env.local
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("ERROR CRÍTICO: No se encontró OPENAI_API_KEY o VITE_OPENAI_API_KEY.");
    console.error("Por favor, crea un archivo .env.local basándote en .env.example");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: apiKey });

  console.log('Leyendo datos_rama.csv...');
  const csvData = fs.readFileSync(join(__dirname, '..', 'datos_rama.csv'), 'utf8');
  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  
  // Extraer ramas únicas
  const ramasUnicas = Array.from(new Set(parsed.data.map(row => row['NOMBRE_RAMA']).filter(Boolean)));
  const ramas = ramasUnicas.filter(r => r && r.trim() !== '');

  console.log(`Pidiendo vectores semánticos de ${ramas.length} ramas a OpenAI (text-embedding-3-small)...`);
  
  // OpenAI permite hasta 2048 elementos por Request en su API de embeddings
  // text-embedding-3-small es el más rápido, barato y multilingüe.
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: ramas,
  });

  const embeddings = ramas.map((rama, index) => {
    return {
      rama,
      vector: response.data[index].embedding // Vector matemático de OpenAI
    };
  });

  const outPath = join(__dirname, '..', 'public', 'embeddings.json');
  fs.writeFileSync(outPath, JSON.stringify(embeddings));
  console.log('¡Embeddings de OpenAI guardados exitosamente en:', outPath, '!');
}

generate().catch(err => {
  console.error('Error generando embeddings con OpenAI:', err);
  process.exit(1);
});
