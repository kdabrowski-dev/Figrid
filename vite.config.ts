import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'figrid-disk-leaderboard',
      configureServer(server) {
        server.middlewares.use('/api/leaderboard', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const filePath = path.resolve(process.cwd(), 'public', 'leaderboard.json');
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed)) {
                  fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch {
                res.statusCode = 500;
                res.end(JSON.stringify({ ok: false }));
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
})

