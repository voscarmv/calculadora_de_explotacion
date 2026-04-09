import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

let extractor: any = null;

self.addEventListener('message', async (event) => {
  const { type, text } = event.data;
  
  if (type === 'init') {
    try {
      if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
          progress_callback: (progress: any) => {
            self.postMessage({ type: 'progress', progress });
          }
        });
      }
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', error: err });
    }
  } else if (type === 'extract') {
    if (!extractor) {
      self.postMessage({ type: 'error', error: 'Extractor not initialized' });
      return;
    }
    try {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      self.postMessage({ type: 'result', vector: Array.from(output.data) });
    } catch (err) {
      self.postMessage({ type: 'error', error: err });
    }
  }
});
