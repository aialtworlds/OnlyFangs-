// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Music Player
// Fixed bottom bar with waveform animation
// Victorian Occult Luxury aesthetic
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, ChevronUp, ChevronDown } from 'lucide-react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  thumbnail?: string;
  tier?: string;
}

interface MusicPlayerProps {
  track: Track | null;
  onClose: () => void;
}

// Waveform bars animation component
function Waveform({ isPlaying, barCount = 32 }: { isPlaying: boolean; barCount?: number }) {
  const bars = Array.from({ length: barCount }, (_, i) => ({
    id: i,
    height: 20 + Math.random() * 60,
    delay: (i / barCount) * 0.8,
    duration: 0.4 + Math.random() * 0.6,
  }));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        height: '40px',
        padding: '0 8px',
      }}
    >
      {bars.map((bar) => (
        <div
          key={bar.id}
          style={{
            width: '3px',
            height: isPlaying ? `${bar.height}%` : '15%',
            background: `linear-gradient(180deg, oklch(0.72 0.09 75) 0%, oklch(0.38 0.14 20) 100%)`,
            borderRadius: '2px',
            transition: 'height 0.15s ease',
            animation: isPlaying
              ? `waveBar ${bar.duration}s ${bar.delay}s ease-in-out infinite alternate`
              : 'none',
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

// Progress bar component
function ProgressBar({
  progress,
  duration,
  onChange,
}: {
  progress: number;
  duration: string;
  onChange: (value: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onChange(pct);
  };

  // Parse duration string "m:ss" to seconds
  const parseDuration = (d: string): number => {
    const parts = d.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return 0;
  };

  const totalSecs = parseDuration(duration);
  const currentSecs = Math.floor(progress * totalSecs);
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '9px',
          color: 'oklch(0.55 0.03 60)',
          letterSpacing: '0.05em',
          minWidth: '32px',
          textAlign: 'right',
        }}
      >
        {formatTime(currentSecs)}
      </span>
      <div
        ref={barRef}
        onClick={handleClick}
        style={{
          flex: 1,
          height: '3px',
          background: 'oklch(0.15 0.01 285)',
          borderRadius: '2px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, oklch(0.38 0.14 20), oklch(0.72 0.09 75))',
            borderRadius: '2px',
            transition: dragging ? 'none' : 'width 0.1s linear',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${progress * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'oklch(0.72 0.09 75)',
            boxShadow: '0 0 8px oklch(0.72 0.09 75 / 60%)',
            transition: dragging ? 'none' : 'left 0.1s linear',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '9px',
          color: 'oklch(0.35 0.02 60)',
          letterSpacing: '0.05em',
          minWidth: '32px',
        }}
      >
        {duration}
      </span>
    </div>
  );
}

export default function MusicPlayer({ track, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.001;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // Reset when track changes
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [track?.id]);

  const handleProgressChange = useCallback((value: number) => {
    setProgress(value);
  }, []);

  if (!track) return null;

  return (
    <>
      {/* Waveform animation keyframes */}
      <style>{`
        @keyframes waveBar {
          0% { height: 15%; }
          100% { height: var(--target-height, 80%); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          background: 'oklch(0.06 0.012 285)',
          borderTop: '1px solid oklch(0.72 0.09 75 / 20%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -8px 40px oklch(0 0 0 / 60%)',
          transition: 'height 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {/* Expand/Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'oklch(0.06 0.012 285)',
            border: '1px solid oklch(0.72 0.09 75 / 20%)',
            borderBottom: 'none',
            color: 'oklch(0.55 0.03 60)',
            cursor: 'pointer',
            padding: '2px 16px',
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: "'Cinzel', serif",
            fontSize: '8px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.09 75)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.03 60)'; }}
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          {expanded ? 'Collapse' : 'Now Playing'}
        </button>

        {/* Main Player Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '12px 24px',
            gap: '16px',
          }}
        >
          {/* Track Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {track.thumbnail ? (
              <img
                src={track.thumbnail}
                alt={track.title}
                style={{
                  width: '44px',
                  height: '44px',
                  objectFit: 'cover',
                  border: '1px solid oklch(0.72 0.09 75 / 20%)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'oklch(0.1 0.02 285)',
                  border: '1px solid oklch(0.72 0.09 75 / 20%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '18px',
                }}
              >
                🎵
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '12px',
                  color: 'oklch(0.93 0.02 80)',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {track.title}
              </div>
              <div
                style={{
                  fontFamily: "'IM Fell English', serif",
                  fontStyle: 'italic',
                  fontSize: '11px',
                  color: 'oklch(0.55 0.03 60)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {track.artist}
              </div>
            </div>
          </div>

          {/* Controls + Waveform */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
            {/* Waveform */}
            <Waveform isPlaying={isPlaying} barCount={28} />

            {/* Control Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setProgress(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'oklch(0.55 0.03 60)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.09 75)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.03 60)'; }}
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'oklch(0.72 0.09 75)',
                  border: 'none',
                  color: 'oklch(0.04 0.008 285)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s, transform 0.1s',
                  boxShadow: '0 0 20px oklch(0.72 0.09 75 / 30%)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.82 0.1 78)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.72 0.09 75)'; }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
              </button>

              <button
                onClick={() => setProgress(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'oklch(0.55 0.03 60)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.09 75)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.03 60)'; }}
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Progress Bar */}
            <ProgressBar
              progress={progress}
              duration={track.duration || '0:00'}
              onChange={handleProgressChange}
            />
          </div>

          {/* Volume + Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setMuted(!muted)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: muted ? 'oklch(0.38 0.14 20)' : 'oklch(0.55 0.03 60)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s',
                }}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div
                style={{
                  width: '80px',
                  height: '3px',
                  background: 'oklch(0.15 0.01 285)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setVolume(Math.max(0, Math.min(1, x / rect.width)));
                  setMuted(false);
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${muted ? 0 : volume * 100}%`,
                    background: 'oklch(0.72 0.09 75)',
                    borderRadius: '2px',
                    transition: 'width 0.1s',
                  }}
                />
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'oklch(0.35 0.02 60)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.38 0.14 20)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.35 0.02 60)'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Expanded View */}
        {expanded && (
          <div
            style={{
              padding: '0 24px 20px',
              borderTop: '1px solid oklch(0.72 0.09 75 / 8%)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              animation: 'fadeUp 0.2s ease',
            }}
          >
            {/* Tier info */}
            {track.tier && (
              <div style={{ paddingTop: '16px' }}>
                <div
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '8px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'oklch(0.35 0.02 60)',
                    marginBottom: '6px',
                  }}
                >
                  Access Tier
                </div>
                <div
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: '11px',
                    color: 'oklch(0.72 0.09 75)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {track.tier}
                </div>
              </div>
            )}

            {/* Large waveform visualization */}
            <div style={{ paddingTop: '16px', display: 'flex', alignItems: 'center' }}>
              <Waveform isPlaying={isPlaying} barCount={48} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
