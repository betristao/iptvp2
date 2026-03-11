import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use('/proxy/', createProxyMiddleware({
    router: (req) => {
       const target = req.originalUrl.replace('/proxy/', '');
       const url = new URL(target);
       return `${url.protocol}//${url.host}`;
    },
    pathRewrite: (path, req) => {
       const target = req.originalUrl.replace('/proxy/', '');
       const url = new URL(target);
       return url.pathname + url.search;
    },
    changeOrigin: true,
    logger: console,
    on: {
      proxyRes: (proxyRes) => {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD';
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
      }
    }
}));

// Serves the pre-compiled Vite React Frontend
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
