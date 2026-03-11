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
                  // Try to provide a more specific referer for RTP channels if possible
                  if (targetUrl.includes('rtp1')) referer = 'https://www.rtp.pt/play/direto/rtp1';
                  else if (targetUrl.includes('rtp2')) referer = 'https://www.rtp.pt/play/direto/rtp2';
                  else if (targetUrl.includes('rtpmem')) referer = 'https://www.rtp.pt/play/direto/rtpmemoria';
                  else referer = 'https://www.rtp.pt/play/direto/';
              } else if (targetUrl.includes('sicnot.live') || targetUrl.includes('sicnoticias')) {
                  origin = 'https://sicnoticias.pt';
                  referer = 'https://sicnoticias.pt/direto';
              } else if (targetUrl.includes('sic.pt') || targetUrl.includes('impresa.pt')) {
                  origin = 'https://sic.pt';
                  referer = 'https://sic.pt/';
              } else if (targetUrl.includes('tvi.iol.pt') || targetUrl.includes('iol.pt')) {
                  origin = 'https://tvi.iol.pt';
                  referer = 'https://tvi.iol.pt/';
              }

              proxyReq.setHeader('Origin', origin);
              proxyReq.setHeader('Referer', referer);
              // Use a very standard Chrome User-Agent
              proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
              
              // Remove any headers that might block us
              proxyReq.removeHeader('X-Frame-Options');
          } catch(e) {}
      },
      proxyRes: (proxyRes) => {
          // Force overwrite CORS headers to allow everything
          proxyRes.headers['access-control-allow-origin'] = '*';
          proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS, HEAD';
          proxyRes.headers['access-control-allow-headers'] = '*';
          proxyRes.headers['access-control-expose-headers'] = '*';
          proxyRes.headers['access-control-allow-credentials'] = 'true';
          
          // Remove security headers that might cause issues in an iframe or player
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
