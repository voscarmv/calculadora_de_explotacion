# Calculadora de Explotación Laboral (Calculadora de Plusvalía) ☭

![React](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![OpenAI](https://img.shields.io/badge/OpenAI-Embeddings-green?logo=openai) ![Typeform Style](https://img.shields.io/badge/UI-Typeform_Minimalist-red)

Una poderosa aplicación educativa e interactiva que revela la magnitud de la explotación laboral en México. Utiliza una interfaz minimalista progresiva (al estilo *Typeform*) e **Inteligencia Artificial** (OpenAI) para catalogar las ocupaciones coloquiales y cruzarlas con los **Datos Reales del Censo Económico del INEGI**, exponiendo cuánta plusvalía absoluta el empleado le regala a su patrón.

---

## 🧐 ¿Qué hace y cómo funciona?

Esta aplicación ayuda al obrero/trabajador a entender económicamente su lugar en el mundo. La aplicación solicita su oficio en sus propias palabras (Ej: *"Trabajo atendiendo el Oxxo"*), y mediante **AI Semantic Search** clasifica su oficio hacia la rama del INEGI más pertinente (Ej: *Comercio al por menor de abarrotes y alimentos*).

Una vez que recibe el **salario real y las horas semanales** del propio usuario, deconstruye su esfuerzo revelando:
1. **La Jornada Diaria:** Cuántos minutos trabajó para pagarse su propio sueldo, cuántos minutos para pagar la infraestructura/maquinaria de la empresa y *cuántas horas laboró gratis para enriquecer a su patrón (Plusvalía)*.
2. **Ciclo Anual:** Sus 12 meses desglosados bajo este mismo lente marxista.
3. **El Robo en Efectivo:** Estimación de cuántos miles de pesos de ganancia (riqueza pura) extraen sus jefes apoyándose de las herramientas del Censo.

## ⚙️ Tecnologías Utilizadas
* **Frontend:** React + Vite, Redux Toolkit, CSS Vanilla ultra optimizado.
* **Inteligencia Artificial:** OpenAI API (`text-embedding-3-small`) para búsqueda semántica e identificación coloquial superando diccionarios de texto.
* **Procesamiento de Datos:** Node.js, Papaparse (manejo limpio de los CSV del Censo Económico). 

---

## 🚀 Instalación y Configuración Paso a Paso

Si has clonado este proyecto y deseas echarlo a andar de forma local, sigue este preciso proceso:

### 1. Variables de Entorno y Llaves
La aplicación usa OpenAI para incrustar vectores semánticos en lugar del frágil almacenamiento de modelos client-side. Necesitas configurarla.

En la raíz del proyecto, copia el molde `.env.example` para crear tu `.env.local` privado:
```bash
cp .env.example .env.local
```
Edita `.env.local` y añade tu clave:
```env
VITE_OPENAI_API_KEY="sk-tu_llave_de_openai_aqui"
OPENAI_API_KEY="sk-tu_llave_de_openai_aqui"
```

### 2. Instalar Dependencias
Instala los módulos de Node para Vite y Transformers (Openai, etc):
```bash
npm install
```

### 3. Generar las Bases de Conocimiento (Data & Embeddings)
El INEGI enlista más de 278 ramas en el archivo `datos_rama.csv`. La aplicación web no procesa esto en tiempo real por rendimiento, requiere de un pre-ensamblaje para que el navegador vuele. 

Abre dos terminales (o ejecútalos uno por uno):

**A) Generar matemáticas para la UI**
Genera el diccionario de tasas de plusvalía y explotación basado en el `.csv`:
```bash
node scripts/generateDatosJSON.js
```
*Si todo sale bien, verás un "datos.json creado en public/"*

**B) Generar Inteligencia Vectorial (Incrustaciones Semánticas)**
Convierte las 278 ramas del INEGI en matemáticas vectoriales. Consumirá un par de fracciones de centavo de tu llave de OpenAI.
```bash
node scripts/generateOpenAIEmbeddings.js
```
*Si todo sale bien, verás "¡Embeddings de OpenAI guardados exitosamente!"*

### 4. Arrancar la Aplicación (Modo Desarrollo)
Ya estás listo. Inicia la calculadora interactiva:
```bash
npm run dev
```

---

## 🛠 Cómo Personalizar Módulos y Enlaces

El sistema está diseñado para que cualquier activista o promotor modifique los redireccionamientos políticos fácil y rápido. 

Dirígete a la parte superior de `src/App.tsx` y edita las siguientes dos variables constantes:
```tsx
const YOUTUBE_URL_DUENOS = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; 
const PARTIDO_COMUNISTA_URL = "https://www.comunistas-mexicanos.org/";    
```
- **Dueños:** Redireccionará a los que digan "Soy dueño de un negocio" en el paso 1.
- **Partido:** Será el link a donde se manda a la clase obrera enfadada tras los resultados en el paso 6.

## 📚 Base Teórica sobre la Plusvalía Implementada (Marx)
Los datos que arroja la calculadora parten del valor inmutable del esfuerzo (según la teoría del valor-trabajo). La aplicación fracciona el 100% de la carga base del Censo en 3 pilares estructurales:

$$ Horas Totales = H_{para\_salario} + H_{para\_infra} + H_{plusvalia} $$

Mediante esta distribución proporcional a fracciones multiplicadas por un turno del usuario (usualmente de 8 Hrs), la aplicación evidencia la extracción neta como un asalto estructurado.

---
*“De cada cual, según sus capacidades, a cada cual, según sus necesidades”*
