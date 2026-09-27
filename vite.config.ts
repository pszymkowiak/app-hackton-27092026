import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'siteready-api',
    configureServer(server) {
      server.middlewares.use('/api/outline', async (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer | string) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { image, mimeType } = JSON.parse(body || '{}');
              const { detectSlabOutline } = await import('./src/server/geminiHandler.ts');
              const result = await detectSlabOutline(image, mimeType || 'image/jpeg');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              console.error('API error in Vite middleware:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
