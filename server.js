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

              if (targetUrl.includes('rtp.pt')) {
                  origin = 'https://www.rtp.pt';
                  referer = 'https://www.rtp.pt/';
              } else if (targetUrl.includes('sicnot.live') || targetUrl.includes('sicnoticias')) {
                  origin = 'https://sicnoticias.pt';
                  referer = 'https://sicnoticias.pt/';
              } else if (targetUrl.includes('sic.pt') || targetUrl.includes('impresa') || targetUrl.includes('cloudfront')) {
                  origin = 'https://sic.pt';
                  referer = 'https://sic.pt/';
              } else if (targetUrl.includes('tvi') || targetUrl.includes('iol')) {
                  origin = 'https://tvi.iol.pt';
                  referer = 'https://tvi.iol.pt/';
              }

              proxyReq.setHeader('Origin', origin);
              proxyReq.setHeader('Referer', referer);
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0');
          } catch(e) {}
      },
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
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
