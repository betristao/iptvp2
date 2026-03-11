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

              // Spoofing for Portuguese Channels (based on M3U recommendations)
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
              // Use the specific Firefox UA recommended for these streams
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0');
              
              proxyReq.removeHeader('X-Frame-Options');
          } catch(e) {}
      },
      proxyRes: (proxyRes) => {
          // Clean CORS for maximum compatibility without credentials conflict
          proxyRes.headers['access-control-allow-origin'] = '*';
          proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS, HEAD';
          proxyRes.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
          
          delete proxyRes.headers['access-control-allow-credentials'];
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
