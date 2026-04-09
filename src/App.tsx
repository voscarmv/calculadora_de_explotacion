import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from './store/store';
import { setEmbeddings, setQueryInput, setResults, setExtracting } from './store/careerSlice';
import { cosineSimilarity } from './utils/math';

function App() {
  const dispatch = useDispatch();

  const { isDataReady, queryInput, results, embeddings, isExtracting } = useSelector(
    (state: RootState) => state.career
  );

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    fetch('/embeddings.json')
      .then(res => res.json())
      .then(data => {
        dispatch(setEmbeddings(data));
        setTimeout(() => setShowSplash(false), 500);
      })
      .catch(err => console.error('Error al descargar pre-embeddings de OpenAI:', err));
  }, [dispatch]);

  const handleSearch = async () => {
    if (!queryInput.trim() || !isDataReady) return;

    // Vite env variable
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      alert("Por favor, configura VITE_OPENAI_API_KEY en tu variable de entorno (.env o .env.local)");
      return;
    }

    dispatch(setExtracting(true));

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          input: queryInput,
          model: 'text-embedding-3-small'
        })
      });

      if (!response.ok) {
         throw new Error(`OpenAI API falló: ${response.statusText}`);
      }

      const data = await response.json();
      const queryVector = data.data[0].embedding;

      const scored = embeddings.map((emb: {rama: string, vector: number[]}) => ({
        rama: emb.rama,
        score: cosineSimilarity(queryVector, emb.vector)
      }));

      // Sort matches depending on best cosine match (highest nearest 1.0)
      scored.sort((a, b) => b.score - a.score);

      dispatch(setResults(scored.slice(0, 20))); // Top 20
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error consultando la API de OpenAI. Revisa la consola o tu API Key.");
    } finally {
      dispatch(setExtracting(false));
    }
  };

  const handleSubmit = () => {
    handleSearch();
  };

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <h1>Clasificador Semántico OpenAI</h1>
          <div className="spinner"></div>
          <p>Cargando base de conocimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1>Calculadora de Rama Laboral</h1>
      <p className="subtitle">Clasificación IA ultra precisa con OpenAI 💬</p>

      <div className="glass-container">
        <div className="status-banner">
          <span className={`status-badge ${isDataReady ? 'ready' : ''}`}></span>
          {isDataReady ? 'Base de vectores OpenAI lista.' : 'Cargando conocimiento...'}
        </div>

        <div className="input-wrapper">
          <label className="input-label" htmlFor="description">
            Describe en detalle o coloquialmente en qué trabajas:
          </label>
          <textarea
            id="description"
            className="main-input"
            placeholder="Ejemplo: Corto pelo, Trabajo de albañil, Vendo garnachas..."
            value={queryInput}
            onChange={(e) => {
              dispatch(setQueryInput(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
          />
          <button 
            className="submit-btn" 
            onClick={handleSubmit} 
            disabled={!isDataReady || !queryInput.trim() || isExtracting}
          >
            {isExtracting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner"></div> Pensando...
              </span>
            ) : 'Consultar a la IA'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-container">
            <h2 className="results-title">Recomendaciones de OpenAI</h2>
            {results.map((res, idx) => (
              <div 
                className="result-card" 
                key={idx} 
                style={{ animationDelay: `${0.02 * idx}s` }}
              >
                <div className="result-rama">{res.rama}</div>
                <div className="result-score">{(res.score * 100).toFixed(1)}% de Similitud</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
