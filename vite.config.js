import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createGeminiSummaryMiddleware } from './server/geminiSummary.js'

function geminiSummaryApi(apiKey) {
  return {
    name: 'gemini-summary-api',
    configureServer(server) {
      server.middlewares.use('/api/summarize', createGeminiSummaryMiddleware(apiKey))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/summarize', createGeminiSummaryMiddleware(apiKey))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), geminiSummaryApi(env.GEMINI_API_KEY || 'AIzaSyCPAfwl7b1bkB4OsXlhfoq3S4B_kdvi1AA')],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
