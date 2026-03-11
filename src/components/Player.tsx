import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
  poster?: string;
}

const getYoutubeEmbedUrl = (url: string) => {
  let videoId = '';
  try {
    if (url.includes('youtube.com/live/')) {
      videoId = url.split('youtube.com/live/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URL(url).searchParams;
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
  } catch (e) {
    console.error('Failed to parse YouTube URL', e);
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
  }
  return null;
};

export const Player: React.FC<PlayerProps> = ({ url, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeEmbedUrl = url ? getYoutubeEmbedUrl(url) : null;

  useEffect(() => {
    if (youtubeEmbedUrl) return; // Don't run HLS logic for YouTube videos
    
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
              // Fails silently if CORS or network error blocks it
              console.error('Network Error (CORS or HTTP code):', data);
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
         console.error('Network Error (Native HLS fallback): Erro a abrir o canal nativamente.');
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
  }, [url, youtubeEmbedUrl]);

  return (
    <div className="player-wrapper">
      {!url ? (
        <div className="empty-state">
          <h2>Selecione um canal</h2>
          <p>Escolha um canal da lista para começar a assistir</p>
        </div>
      ) : youtubeEmbedUrl ? (
        <iframe
          src={youtubeEmbedUrl}
          className="video-player"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title="YouTube Video Player"
          style={{ width: '100%', height: '100%', border: 'none' }}
        ></iframe>
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
