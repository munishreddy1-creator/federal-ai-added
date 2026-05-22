import { createServer } from 'vite';
import { createGeminiSummaryMiddleware } from './server/geminiSummary.js';

const server = await createServer({
  plugins: [{
    name: 'test-api',
    configureServer(s) {
      s.middlewares.use('/api/summarize', createGeminiSummaryMiddleware('dummy'));
    }
  }]
});

await server.listen(5174);
console.log('Listening on 5174');

const res = await fetch('http://localhost:5174/api/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ form: {}, result: {} })
});

console.log('Status:', res.status);
console.log('Body:', await res.text());

await server.close();
