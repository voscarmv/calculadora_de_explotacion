import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { store, type RootState } from './store/store';
import { setEmbeddings, setModelReady, setExtracting, setQueryInput, setResults } from './store/careerSlice';
import { cosineSimilarity } from './utils/math';

function App() {
  const dispatch = useDispatch();
  const workerRef = useRef<Worker | null>(null);

  const { isModelReady, isExtracting, queryInput, results } = useSelector(
    (state: RootState) => state.career
  );

  const [loadingMsg, setLoadingMsg] = useState('Inicializando aplicación...');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('App montada. Iniciando petición de embeddings.json...');
    // 1. Fetch precomputed embeddings from json
    fetch('/embeddings.json')
      .then(res => {
        console.log('Respuesta de embeddings.json:', res.status, res.statusText);
        return res.json();
      })
      .then(data => {
        console.log(`Cargados ${data.length} embeddings desde el JSON local.`);
        dispatch(setEmbeddings(data));
      })
      .catch(err => console.error('Error al descargar pre-embeddings:', err));

    // 2. Initialize web worker for transformers
    console.log('Iniciando Web Worker para el modelo de IA...');
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

    workerRef.current.addEventListener('message', (event) => {
      const { type, vector, progress, error, status, file } = event.data;
      if (type === 'ready') {
        console.log('Worker Reporta: Modelo IA LISTO.');
        dispatch(setModelReady(true));
        setLoadingMsg('¡Modelo Listo!');
        setTimeout(() => setShowSplash(false), 800); // Dar un momento para ocultar el splash
      } else if (type === 'progress') {
        // Puede dar estados como "initiate", "download", "done"
        console.log('Progreso de descarga del modelo:', event.data);
      } else if (status === 'initiate') {
        setLoadingMsg(`Descargando componente: ${file}...`);
      } else if (status === 'download') {
         // progreso
      } else if (status === 'progress') {
         setLoadingMsg(`Descargando parte del modelo... ${(progress).toFixed(2)}%`);
      } else if (status === 'done') {
         setLoadingMsg(`Componente finalizado: ${file}`);
      } else if (type === 'result') {
        console.log('Worker Reporta vectorización exitosa. Procediendo a buscar similitudes...');
        handleVectorResult(vector);
      } else if (type === 'error') {
        console.error('Error del Worker:', error);
        dispatch(setExtracting(false));
      }
    });

    setLoadingMsg('Solicitando inicialización de modelo en el Worker...');
    workerRef.current.postMessage({ type: 'init' });

    return () => {
      workerRef.current?.terminate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVectorResult = (queryVector: number[]) => {
    // FIX: Get the latest embeddings from the store directly because of stale closure
    const currentEmbeddings = store.getState().career.embeddings;

    if (!currentEmbeddings.length) {
      console.warn('¡Las embeddings base no han cargado! No se puede comparar.');
      dispatch(setExtracting(false));
      return;
    }

    console.log(`Realizando similitud de coseno contra ${currentEmbeddings.length} ramas...`);
    const scored = currentEmbeddings.map(emb => ({
      rama: emb.rama,
      score: cosineSimilarity(queryVector, emb.vector)
    }));

    // Sort descending
    scored.sort((a, b) => b.score - a.score);
    console.log('Resultados más similares:', scored.slice(0, 20));

    dispatch(setResults(scored.slice(0, 20))); // Top 20
    dispatch(setExtracting(false));
  };

  const handleSubmit = () => {
    console.log('¡Botón clickeado con el texto! ->', queryInput);
    if (!queryInput.trim()) {
      console.warn('El texto está vacío o solo tiene espacios en blanco.');
      return;
    }
    if (!isModelReady) {
      console.warn('El modelo aún no está listo. Ignorando click.');
      return;
    }
    
    console.log('Mandando texto al Worker para extraer features...');
    dispatch(setExtracting(true));
    workerRef.current?.postMessage({ type: 'extract', text: queryInput });
  };

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <h1>Iniciando Inteligencia Artificial</h1>
          <div className="spinner"></div>
          <p>{loadingMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1>Calculadora de Rama Laboral</h1>
      <p className="subtitle">Encuentra tu clasificación económica ideal con IA 🧠</p>

      <div className="glass-container">
        <div className="status-banner">
          <span className={`status-badge ${isModelReady ? 'ready' : ''}`}></span>
          {isModelReady ? 'Modelo de IA completamente funcional.' : loadingMsg}
        </div>

        <div className="input-wrapper">
          <label className="input-label" htmlFor="description">
            ¿A qué te dedicas? Descríbelo con detalle.
          </label>
          <textarea
            id="description"
            className="main-input"
            placeholder="Ejemplo: Soy programador, creo páginas web y mantengo sistemas de ventas en la nube..."
            value={queryInput}
            onChange={(e) => dispatch(setQueryInput(e.target.value))}
            autoFocus
          />
          <button 
            className="submit-btn" 
            onClick={handleSubmit} 
            disabled={!isModelReady || isExtracting || !queryInput.trim()}
          >
            {isExtracting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner"></div> Analizando...
              </span>
            ) : 'Buscar Rama'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-container">
            <h2 className="results-title">Resultados Sugeridos</h2>
            {results.map((res, idx) => (
              <div 
                className="result-card" 
                key={idx} 
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className="result-rama">{res.rama}</div>
                <div className="result-score">{(res.score * 100).toFixed(1)}% Match</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
