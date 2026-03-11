export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
}

export function parseM3U(content: string): Channel[] {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      
      const parts = line.split(',');
      const name = parts.length > 1 ? parts.slice(1).join(',').trim() : 'Unknown';

      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : name,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
        group: groupTitleMatch ? groupTitleMatch[1] : 'Uncategorized',
        name,
      };
    } else if (line.startsWith('http')) {
      if (currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as Channel);
        currentChannel = {};
      }
    }
  }

  return channels;
}
