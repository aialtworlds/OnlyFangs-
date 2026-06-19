// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Music Player Context
// Global state for the music player
// ═══════════════════════════════════════════════════════════

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Track } from '@/components/MusicPlayer';

interface MusicPlayerContextType {
  currentTrack: Track | null;
  playTrack: (track: Track) => void;
  closePlayer: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType>({
  currentTrack: null,
  playTrack: () => {},
  closePlayer: () => {},
});

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
  };

  const closePlayer = () => {
    setCurrentTrack(null);
  };

  return (
    <MusicPlayerContext.Provider value={{ currentTrack, playTrack, closePlayer }}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  return useContext(MusicPlayerContext);
}
