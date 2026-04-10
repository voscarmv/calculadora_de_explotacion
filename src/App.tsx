import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from './store/store';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { setInitialData, nextStep, setStep, setQueryInput, setResults, setSelectedRama, setSalary, setHours, setExtracting } from './store/careerSlice';
import { cosineSimilarity } from './utils/math';

// ============================================
// VARIABLES DE CONFIGURACIÓN
// ============================================
const YOUTUBE_URL_DUENOS = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // <-- Cambia la URL del video para dueños
const PARTIDO_COMUNISTA_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdHqbHziMqCUUKp45ORzrZHAJuPuBYBc3V_EZGDAsBnetxUXA/viewform";    // <-- Cambia la URL final de acción

function App() {
  const dispatch = useDispatch();
  const { isDataReady, step, queryInput, results, selectedRama, salary, hours, isExtracting, embeddings, datos } = useSelector(
    (state: RootState) => state.career
  );

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}embeddings.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}datos.json`).then(r => r.json())
    ]).then(([embs, dats]) => {
      dispatch(setInitialData({ embeddings: embs, datos: dats }));
    }).catch((err) => {
      console.error('Error cargando bases de datos', err);
    });
  }, [dispatch]);

  const handleDueño = () => {
    alert("¡Gracias por participar! Al ser dueño de los medios de producción, tus métricas son distintas.");
    window.location.href = YOUTUBE_URL_DUENOS;
  };

  const findMatch = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      alert("Por favor, configura VITE_OPENAI_API_KEY en tu .env.local");
      return;
    }
    dispatch(setExtracting(true));
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ input: queryInput, model: 'text-embedding-3-small' })
      });
      if (!response.ok) throw new Error("API falló");
      const data = await response.json();
      const qVec = data.data[0].embedding;

      const scored = embeddings.map((emb: { rama: string, vector: number[] }) => ({
        rama: emb.rama,
        score: cosineSimilarity(qVec, emb.vector)
      }));
      scored.sort((a, b) => b.score - a.score);
      dispatch(setResults(scored.slice(0, 5))); // Solo mostramos 5 opciones para no abrumar
      dispatch(nextStep());
    } catch {
      alert("Ocurrió un error contactando la Inteligencia Artificial. Revisa tu consola.");
    } finally {
      dispatch(setExtracting(false));
    }
  };

  const renderStep = () => {
    if (!isDataReady) {
      return (
        <div className="typeform-container">
          <div className="spinner"></div>
          <h2 style={{ marginTop: 20, color: 'var(--text-muted)' }}>Cargando conocimientos...</h2>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div className="typeform-container step-card">
            <h1>Para empezar, ¿eres empleado o eres dueño de un negocio?</h1>
            <div className="options-grid">
              <button className="btn-option" onClick={() => dispatch(nextStep())}>🧑‍🔧 Soy empleado / Trabajador</button>
              <button className="btn-option" onClick={handleDueño}>💼 Soy dueño de negocio / Patrón</button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="typeform-container step-card">
            <h1>¿A qué te dedicas en tu trabajo?</h1>
            <p className="helper-text">Descríbelo con tus propias palabras (ej. Corto el cabello, despachador de gasolina, ingeniero).</p>
            <input
              type="text"
              className="main-input"
              placeholder="Escribe tu oficio o profesión aquí..."
              value={queryInput}
              onChange={e => dispatch(setQueryInput(e.target.value))}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && queryInput.trim() && findMatch()}
            />
            <button className="btn-primary" onClick={findMatch} disabled={!queryInput.trim() || isExtracting}>
              {isExtracting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> Pensando...
                </span>
              ) : 'Siguiente'}
            </button>
            <button className="btn-secondary" style={{ marginTop: 15 }} onClick={() => dispatch(setStep(step - 1))}>
              Atrás
            </button>
          </div>
        );

      case 3:
        return (
          <div className="typeform-container step-card">
            <h1>¿De estas opciones, cuál es tu ramo?</h1>
            <p className="helper-text">Nuestra Inteligencia Artificial encontró estas ramas económicas. Elige la más cercana a tu ocupación.</p>
            <div className="options-grid">
              {results.map((r, i) => (
                <button
                  key={i}
                  className="btn-option"
                  onClick={() => {
                    dispatch(setSelectedRama(r.rama));
                    dispatch(nextStep());
                  }}
                >
                  {r.rama}
                </button>
              ))}
              <button style={{ marginTop: 20 }} className="btn-secondary" onClick={() => {
                dispatch(setSelectedRama("_GLOBAL_"));
                dispatch(nextStep());
              }}>
                No estoy seguro, prefiero omitir / usar el promedio nacional.
              </button>
              <button style={{ marginTop: 15 }} className="btn-secondary" onClick={() => dispatch(setStep(step - 1))}>
                Atrás
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="typeform-container step-card">
            <h1>¿Cuánto ganas al mes, libre de impuestos?</h1>
            <p className="helper-text">En Pesos Mexicanos (MXN). No guardamos ningún dato que pongas aquí.</p>
            <input
              type="number"
              className="main-input"
              placeholder="$ 0"
              value={salary}
              onChange={e => dispatch(setSalary(e.target.value))}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && salary && dispatch(nextStep())}
            />
            <button className="btn-primary" onClick={() => dispatch(nextStep())} disabled={!salary}>
              Siguiente
            </button>
            <button className="btn-secondary" style={{ marginTop: 15 }} onClick={() => dispatch(setStep(step - 1))}>
              Atrás
            </button>
          </div>
        );

      case 5:
        return (
          <div className="typeform-container step-card">
            <h1>¿Cuántas horas trabajas a la semana?</h1>
            <p className="helper-text">Incluye tiempo de transporte o las horas extra (incluso si no te las pagan) si quieres ver un cálculo brutalmente honesto.</p>
            <input
              type="number"
              className="main-input"
              placeholder="Ej. 48"
              value={hours}
              onChange={e => dispatch(setHours(e.target.value))}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && hours && dispatch(nextStep())}
            />
            <button className="btn-primary" onClick={() => dispatch(nextStep())} disabled={!hours}>
              Revelar mis resultados
            </button>
            <button className="btn-secondary" style={{ marginTop: 15 }} onClick={() => dispatch(setStep(step - 1))}>
              Atrás
            </button>
          </div>
        );

      case 6: {
        const d = datos[selectedRama || '_GLOBAL_'] || datos['_GLOBAL_'];
        const totalBase = d.HRS_PARA_SALARIO + d.HRS_PARA_INFRAESTRUCTURA + d.HRS_PLUSVALIA_NETA;

        const pSal = d.HRS_PARA_SALARIO / totalBase;
        const pInf = d.HRS_PARA_INFRAESTRUCTURA / totalBase;
        const pPlu = d.HRS_PLUSVALIA_NETA / totalBase;

        // Horas diarias asumidas en turno fijo
        const hrsDiarias = 8;
        const minDiaSal = Math.round(pSal * hrsDiarias * 60);
        const minDiaInf = Math.round(pInf * hrsDiarias * 60);
        const minDiaPlu = Math.round(pPlu * hrsDiarias * 60);

        const formatMin = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)} hrs` : `${m} min`;

        const mesesSal = (pSal * 12).toFixed(1);
        const mesesInf = (pInf * 12).toFixed(1);
        const mesesPlu = (pPlu * 12).toFixed(1);

        const tasa = d.TASA_EXPLOTACION;

        const salarioNum = Number(salary);
        const valorGeneradoMensual = salarioNum / pSal;
        const roboMensual = valorGeneradoMensual * pPlu;

        return (
          <div className="typeform-container step-card" style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '3rem', color: 'var(--accent)' }}>La Realidad de tu Explotación</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px', fontWeight: 500 }}>
              Con los <a href="https://github.com/voscarmv/marx" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}>datos del Censo Económico del INEGI</a> para <b>{selectedRama === '_GLOBAL_' ? 'el promedio mexicano' : selectedRama}</b>, esto es lo que descubrimos de tu vida laboral:
            </p>

            <div className="result-container">
              <div className="result-stat">
                <h3>TU JORNADA DIARIA DE 8 HORAS, DECONSTRUIDA:</h3>
                <p>Te pagas a ti mismo en {formatMin(minDiaSal)}.</p>
                <p>Durante {formatMin(minDiaInf)} le pagas la luz, internet y máquinas a tu empresa.</p>
                <p style={{ color: 'var(--accent)' }}>Y por unas aplastantes {formatMin(minDiaPlu)}, trabajas absolutamente gratis, como ganancia neta para el patrón.</p>
              </div>

              <div className="result-stat">
                <h3>DE TUS 12 MESES TRABAJANDO AL AÑO:</h3>
                <p>Cielos... Cubres tu salario de todo el año produciendo riqueza equivalente a <b>{mesesSal} meses</b>.</p>
                <p>La infraestructura la pagas en tan solo <b>{mesesInf} meses</b>.</p>
                <p style={{ color: 'var(--accent)' }}>Tú le regalas tu sudor como riqueza pura a los dueños durante <b>{mesesPlu} meses completos</b>.</p>
              </div>

              <div className="result-stat">
                <h3>$ EL DINERO: ¿CUÁNTO TE ROBAN MENSCH? $</h3>
                <p>Tú crees que ganas ${salarioNum.toLocaleString()}, pero en realidad de tus manos sale mucha más riqueza.</p>
                <p style={{ color: 'var(--accent)' }}>Tú y tu dolor de espalda generan ${roboMensual.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN de plusvalía (ganancias para el patrón) **cada maldito mes**.</p>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>(Tasa de Explotación Oficial validada: {tasa})</p>
              </div>
            </div>

            <div className="communist-tone">
              <p>
                <strong>¡Despierta Camarada!</strong>
              </p>
              <br />
              <p>
                Dejas tu fuerza vital, tu juventud y <b>{hours} valiosas horas cada semana</b> para que un burgués apellidado "Slim" o tu "jefe buena onda" recoja los frutos de tu trabajo para comprarse otra camioneta del año. Te lavan el cerebro diciéndote que te vas a hacer rico "echándole ganas", mientras tú generas miles de pesos que van directos a su cuenta de banco.
              </p>
              <br />
              <p>
                <b>El capitalismo es el peor robo de la historia, normalizado a los ojos de todos.</b>
                Ellos te necesitan para mover las máquinas, ¡pero tú a ellos no!
              </p>

              <div style={{ marginTop: 40, textAlign: 'center' }}>
                <a href={PARTIDO_COMUNISTA_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ transform: 'scale(1.1)' }}>¡Únete al Partido Comunista y rebélate!</button>
                </a>
              </div>
            </div>

            <div style={{ marginTop: 50, textAlign: 'center', marginBottom: 50 }}>
              <button
                className="btn-secondary"
                style={{ marginRight: 15, marginBottom: 15 }}
                onClick={() => dispatch(setStep(step - 1))}
              >
                Atrás
              </button>
              <button
                className="btn-secondary"
                style={{ marginBottom: 15 }}
                onClick={() => {
                  dispatch(setStep(1));
                  dispatch(setQueryInput(''));
                  dispatch(setSalary(''));
                  dispatch(setHours(''));
                }}
              >
                Volver a Calcular Otro Puesto
              </button>
              <div style={{ marginTop: 30 }}>
                <a href="https://github.com/voscarmv/calculadora_de_explotacion" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                  Ver el código fuente de este formulario en GitHub
                </a>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <>
      {renderStep()}
    </>
  );
}

export default App;
