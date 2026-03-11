import { useState, useEffect, useMemo } from 'react';
import { Search, PlayCircle, Tv, MonitorPlay, WifiOff } from 'lucide-react';
import { Channel, parseM3U } from './utils/m3u';
import { Player } from './components/Player';
import './index.css';

const DEFAULT_PLAYLIST_URL = 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/M3U/M3UPT.m3u';

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        // Using the direct raw GitHub URL automatically bypasses CORS because GitHub sends Access-Control-Allow-Origin: *
        const response = await fetch(DEFAULT_PLAYLIST_URL);
        if (!response.ok) {
          throw new Error('Falha ao carregar a lista de canais');
        }
        const text = await response.text();
        const parsedChannels = parseM3U(text);
        
        // Remove duplicates if any
        const uniqueChannels = Array.from(new Map(parsedChannels.map(c => [c.id || c.name, c])).values());
        
        setChannels(uniqueChannels);
        if (uniqueChannels.length > 0) {
           setError('');
        } else {
           setError('Nenhum canal encontrado na lista.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao baixar a lista M3U. Verifique a conexão.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, []);

  const groups = useMemo(() => {
    const allGroups = channels.map(c => c.group || 'Outros');
    return ['All', ...Array.from(new Set(allGroups)).sort()];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === 'All' || (channel.group || 'Outros') === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [channels, searchTerm, selectedGroup]);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <MonitorPlay size={24} className="brand-icon" />
          <h2>M3U PT Player</h2>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar canais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="group-select"
          >
            {groups.map(group => (
              <option key={group} value={group}>
                {group === 'All' ? 'Todos os Canais' : group}
              </option>
            ))}
          </select>
        </div>

        <div className="channels-list">
          {loading ? (
            <div className="loader">Carregando lista...</div>
          ) : error ? (
            <div className="error-message">
              <WifiOff size={48} />
              <p>{error}</p>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="empty-message">Nenhum canal localizado.</div>
          ) : (
            filteredChannels.map((channel, idx) => (
              <button
                key={`${channel.id}-${idx}`}
                className={`channel-card ${activeChannel?.url === channel.url ? 'active' : ''}`}
                onClick={() => {
                  setActiveChannel(channel);
                  if (window.innerWidth <= 768) {
                    setSidebarOpen(false);
                  }
                }}
              >
                <div className="channel-logo">
                  {channel.logo ? (
                     <img src={channel.logo} alt={channel.name} loading="lazy" onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                     }} />
                  ) : (
                    <Tv size={24} />
                  )}
                </div>
                <div className="channel-info">
                  <h3 className="channel-name">{channel.name}</h3>
                  <span className="channel-group">{channel.group || 'Outros'}</span>
                </div>
                <PlayCircle size={20} className="play-icon" />
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="mobile-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Tv size={24} />
          </button>
          <h2>{activeChannel ? activeChannel.name : 'IPTV Player'}</h2>
        </header>

        <div className="player-section">
          <Player url={activeChannel?.url || ''} poster={activeChannel?.logo} />
          

        </div>
      </main>
    </div>
  );
}

export default App;
