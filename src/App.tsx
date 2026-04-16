import { useEffect, useState } from 'react';
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
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
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

            <div style={{ marginTop: 40, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', textAlign: 'center', opacity: 0.8 }}>
              <button
                onClick={() => setShowPrivacyNotice(true)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', padding: 0, marginTop: '10px' }}
              >
                Ver Aviso de Privacidad Integral
              </button>
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
        const totalBase = d.HRS_PARA_SALARIO + d.HRS_OPERACION + d.HRS_IMPUESTOS + d.HRS_PLUSVALIA_NETA;

        const pSal = d.HRS_PARA_SALARIO / totalBase;
        const pOpe = d.HRS_OPERACION / totalBase;
        const pImp = d.HRS_IMPUESTOS / totalBase;
        const pPlu = d.HRS_PLUSVALIA_NETA / totalBase;

        // Horas diarias asumidas en turno fijo
        const hrsDiarias = 8;
        const minDiaSal = Math.round(pSal * hrsDiarias * 60);
        const minDiaOpe = Math.round(pOpe * hrsDiarias * 60);
        const minDiaImp = Math.round(pImp * hrsDiarias * 60);
        const minDiaPlu = Math.round(pPlu * hrsDiarias * 60);

        const formatMin = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)} hrs` : `${m} min`;

        const mesesSal = (pSal * 12).toFixed(1);
        const mesesOpe = (pOpe * 12).toFixed(1);
        const mesesImp = (pImp * 12).toFixed(1);
        const mesesPlu = (pPlu * 12).toFixed(1);

        const tasa = d.TASA_EXPLOTACION;

        const salarioNum = Number(salary);
        const valorGeneradoMensual = salarioNum / pSal;
        const roboMensual = valorGeneradoMensual * pPlu;
        const valorOperacionMensual = valorGeneradoMensual * pOpe;

        return (
          <div className="typeform-container step-card" style={{ maxWidth: '900px' }}>
            <h1 style={{ fontSize: '3rem', color: 'var(--accent)' }}>La Realidad de tu Explotación</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px', fontWeight: 500 }}>
              Con los <a href="https://github.com/voscarmv/marx" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}>datos del Censo Económico del INEGI</a> para <b>{selectedRama === '_GLOBAL_' ? 'el promedio mexicano' : selectedRama}</b>, esto es lo que descubrimos de tu vida laboral:
            </p>

            <div className="result-container">
              <div className="result-stat">
                <h3>TU JORNADA DIARIA DE 8 HORAS, DECONSTRUIDA:</h3>
                <ul style={{ paddingLeft: '20px', margin: '15px 0', textAlign: 'left' }}>
                  <li style={{ marginBottom: '10px' }}>Te pagas a ti mismo en {formatMin(minDiaSal)}.</li>
                  <li style={{ marginBottom: '10px' }}>Durante {formatMin(minDiaOpe)} le pagas la operación e infraestructura (luz, internet, máquinas) a la empresa. <b>(Esto también es plusvalía para el patrón, ya que esta infraestructura se convierte en su propiedad privada, no de los trabajadores)</b>.</li>
                  <li style={{ marginBottom: '10px' }}>Durante {formatMin(minDiaImp)} de tu día trabajas solo para pagar impuestos.</li>
                  <li style={{ color: 'var(--accent)' }}>Y por unas aplastantes {formatMin(minDiaPlu)}, trabajas absolutamente gratis, como ganancia neta para el patrón.</li>
                </ul>
              </div>

              <div className="result-stat">
                <h3>DE TUS 12 MESES TRABAJANDO AL AÑO:</h3>
                <ul style={{ paddingLeft: '20px', margin: '15px 0', textAlign: 'left' }}>
                  <li style={{ marginBottom: '10px' }}>Cielos... Cubres tu salario de todo el año produciendo riqueza equivalente a <b>{mesesSal} meses</b>.</li>
                  <li style={{ marginBottom: '10px' }}>La operación e infraestructura de la empresa la pagas en tan solo <b>{mesesOpe} meses</b>.</li>
                  <li style={{ marginBottom: '10px' }}>Destinas <b>{mesesImp} meses</b> íntegros del año a pagar impuestos.</li>
                  <li style={{ color: 'var(--accent)' }}>Tú le regalas tu sudor como riqueza pura a los dueños durante <b>{mesesPlu} meses completos</b>.</li>
                </ul>
              </div>

              <div className="result-stat">
                <h3>$ EL DINERO: ¿CUÁNTO TE ROBAN AL MES? $</h3>
                <ul style={{ paddingLeft: '20px', margin: '15px 0', textAlign: 'left' }}>
                  <li style={{ marginBottom: '10px' }}>Tú crees que ganas ${salarioNum.toLocaleString()}, pero en realidad de tus manos sale mucha más riqueza.</li>
                  <li style={{ color: 'var(--accent)', marginBottom: '10px' }}>Tú y tu dolor de espalda generan <b>${roboMensual.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</b> de plusvalía neta (ganancias líquidas para el patrón) cada maldito mes.</li>
                  <li style={{ color: 'var(--accent)', marginBottom: '10px' }}>Además, pagas <b>${valorOperacionMensual.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN</b> mensuales para la infraestructura, equipo y operación (propiedad privada del patrón).</li>
                  <li style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '10px' }}>¡EN TOTAL! Generas una PLUSVALÍA TOTAL de ${(roboMensual + valorOperacionMensual).toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN al mes (Plusvalía Neta + Infraestructura) apropiada por el patrón.</li>
                </ul>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '20px' }}>(Tasa de Explotación Oficial validada: {tasa})</p>
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

      {showPrivacyNotice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
          justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--card-bg, #1e1e1e)', color: 'var(--text, #fff)',
            padding: '30px', borderRadius: '12px', maxWidth: '650px',
            maxHeight: '85vh', overflowY: 'auto', textAlign: 'left',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--accent, #ff4c4c)', fontSize: '1.5rem' }}>Aviso de Privacidad Integral</h2>
            <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong>1. Identidad y domicilio del Responsable</strong><br />
                Entropy Labs, con contacto electrónico en <a href="mailto:contacto@entropylabs.mx" style={{ color: 'inherit', textDecoration: 'underline' }}>contacto@entropylabs.mx</a>, es el responsable del uso y protección de sus datos personales, y al respecto le informamos lo siguiente:</p>

              <p><strong>2. Datos personales sometidos a tratamiento</strong><br />
                Para llevar a cabo las finalidades descritas en este aviso de privacidad, le informamos que <strong>esta aplicación no recaba, guarda, ni almacena ningún dato personal</strong> que lo identifique (como nombre, teléfono, correo, identificadores de dispositivo, IP o ubicación). Los datos estadísticos y salariales proporcionados se procesan únicamente en la memoria local de su dispositivo de forma anónima y volátil durante su sesión.</p>

              <p><strong>3. Finalidades del tratamiento</strong><br />
                El único dato extraído de su dispositivo es la "descripción de su ocupación". Esta información se recolecta y utiliza exclusivamente para la siguiente finalidad primaria:<br />
                • Procesar el texto mediante el uso de inteligencia artificial para encontrar la rama económica equivalente más cercana contenida en nuestra base de datos local precalculada.</p>

              <p><strong>4. Transferencia de información técnica a terceros</strong><br />
                Para cumplir de forma estricta con la finalidad descrita, el texto de su ocupación es enviado de forma temporal, aislada y anonimizada a la interfaz de programación de aplicaciones (API) de OpenAI (<code style={{ fontSize: '0.8rem' }}>api.openai.com</code>). De acuerdo con sus políticas comerciales para el uso de la API, OpenAI almacena esta solicitud temporalmente por motivos de seguridad hasta por 30 días, no utiliza esta información enviada vía API para entrenar ninguno de sus modelos de lenguaje, y posteriormente nos devuelve la clasificación semántica (embedding matemático). Para conocer detalladamente este tratamiento por el tercero, le invitamos a consultar las políticas de privacidad de OpenAI en: <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>https://openai.com/policies/privacy-policy</a>.</p>

              <p><strong>5. Derechos ARCO y revocación del consentimiento</strong><br />
                Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse (Derechos ARCO) al tratamiento de sus datos personales. Sin embargo, dado que en nuestros sistemas no elaboramos perfiles, no usamos cookies de rastreo y no almacenamos una base de datos con información que pueda identificarlo personalmente o vincularlo de forma retrospectiva con la "descripción de la ocupación" ingresada, existe una imposibilidad material para dar trámite a este tipo de solicitudes sobre sus interacciones previas. Para cualquier aclaración, el canal oficial sigue siendo: <a href="mailto:contacto@entropylabs.mx" style={{ color: 'inherit', textDecoration: 'underline' }}>contacto@entropylabs.mx</a>.</p>

              <p><strong>6. Uso de tecnologías de rastreo</strong><br />
                Le informamos oficialmente que en esta página de internet no utilizamos cookies, web beacons u otras tecnologías similares para recabar o rastrear información sobre su comportamiento u origen metodológico como usuario de internet.</p>

              <p><strong>7. Modificaciones al aviso de privacidad</strong><br />
                El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales, de nuestras propias necesidades operativas o de nuestras prácticas de privacidad. Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso a través de su publicación constante y actualizada en esta misma aplicación de acceso público.</p>

              <p><em>Última actualización: Abril de 2026.</em></p>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => setShowPrivacyNotice(false)}
                style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              >
                Cerrar Aviso Integral
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
