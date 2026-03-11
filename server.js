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
      proxyReq: (proxyReq, req) => {
          const targetUrl = req.originalUrl.replace('/proxy/', '');
          try {
              const urlObj = new URL(targetUrl);
              let origin = `https://${urlObj.hostname}`;
              let referer = origin + '/';

              // Specific Spoofing for Portuguese Channels
              if (targetUrl.includes('rtp.pt')) {
                  origin = 'https://www.rtp.pt';
                  referer = 'https://www.rtp.pt/';
              } else if (targetUrl.includes('sicnot.live') || targetUrl.includes('sicnoticias') || targetUrl.includes('impresa.pt')) {
                  origin = 'https://sicnoticias.pt';
                  referer = 'https://sicnoticias.pt/';
              } else if (targetUrl.includes('tvi.iol.pt') || targetUrl.includes('iol.pt')) {
                  origin = 'https://tvi.iol.pt';
                  referer = 'https://tvi.iol.pt/';
              }

              proxyReq.setHeader('Origin', origin);
              proxyReq.setHeader('Referer', referer);
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
              
              proxyReq.removeHeader('X-Frame-Options');
          } catch(e) {}
      },
      proxyRes: (proxyRes) => {
          proxyRes.headers['access-control-allow-origin'] = '*';
          proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS, HEAD';
          proxyRes.headers['access-control-allow-headers'] = '*';
          proxyRes.headers['access-control-expose-headers'] = '*';
          proxyRes.headers['access-control-allow-credentials'] = 'true';
          
          delete proxyRes.headers['content-security-policy'];
          delete proxyRes.headers['x-frame-options'];
          delete proxyRes.headers['x-content-type-options'];
      }
    }
}));

// Serves the pre-compiled Vite React Frontend
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
