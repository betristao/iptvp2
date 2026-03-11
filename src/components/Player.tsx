import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
  poster?: string;
}

export const Player: React.FC<PlayerProps> = ({ url, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: Hls | null = null;

    if (Hls.isSupported() && url.includes('.m3u8')) {
      hls = new Hls({
        maxBufferLength: 30,
        enableWorker: true,
        xhrSetup: (xhr, fileUrl) => {
          // Send all requests through our local proxy
          const bypassUrl = `${window.location.origin}/proxy/${fileUrl}`;
          xhr.open('GET', bypassUrl, true);
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Network errors are mostly CORS or 403 Forbidden issues in IPTV
              console.error('Network Error (Likely CORS):', data);
              alert(
                'Falha ao carregar o canal. Isto acontece frequentemente porque os provedores destes canais de IPTV (RTP, SIC, TVI) bloqueiam a reprodução no navegador (Erros CORS).\n\nPara assistir aos canais, instale e ative uma extensão "CORS Unblocker" no seu browser (como "Allow CORS: Access-Control-Allow-Origin" for Chrome).'
              );
              hls?.destroy();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              break;
          }
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log('Autoplay prevented:', e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari or browsers with native HLS support
      const bypassUrl = `${window.location.origin}/proxy/${url}`;
      video.src = bypassUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.log('Autoplay prevented:', e));
      });
      video.addEventListener('error', () => {
         alert('Erro a abrir o canal nativamente. Verifique as configurações de CORS ou use o Safari num Mac/iOS.');
      });
    } else {
      // Fallback for direct mp4 or other supported types
      video.src = url;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <div className="player-wrapper">
      {!url ? (
        <div className="empty-state">
          <h2>Selecione um canal</h2>
          <p>Escolha um canal da lista para começar a assistir</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          autoPlay
          poster={poster}
          className="video-player"
          playsInline
        />
      )}
    </div>
  );
};
