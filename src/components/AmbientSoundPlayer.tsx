'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Pause, Play, Sparkles } from 'lucide-react';

// Global persistent audio singleton so music never stops across page navigations
let globalAudio: HTMLAudioElement | null = null;
let hasUserInteracted = false;

function getOrCreateAudio(): HTMLAudioElement {
  if (typeof window === 'undefined') {
    return null as unknown as HTMLAudioElement;
  }

  if (!globalAudio) {
    globalAudio = new Audio('/ambient.m4a');
    globalAudio.loop = true;
    globalAudio.volume = 1.0; // 100% volume default
    globalAudio.preload = 'auto';
  }

  return globalAudio;
}

export default function AmbientSoundPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const userPausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = getOrCreateAudio();
    if (!audio) return;

    // Sync initial state
    setIsPlaying(!audio.paused && audio.currentTime > 0);
    setVolume(audio.volume);
    setIsMuted(audio.muted);

    const handlePlay = () => {
      setIsPlaying(true);
      setNeedsInteraction(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Attempt to start audio immediately
    const startAudio = () => {
      if (userPausedRef.current) return;
      audio.muted = false;
      audio.volume = volume;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setNeedsInteraction(false);
            hasUserInteracted = true;
          })
          .catch(() => {
            // Autoplay blocked by browser policy until user gesture
            setIsPlaying(false);
            setNeedsInteraction(true);
          });
      }
    };

    // If audio is already playing from previous page, keep playing!
    if (!audio.paused) {
      setIsPlaying(true);
      setNeedsInteraction(false);
    } else if (!userPausedRef.current) {
      startAudio();
    }

    // Global interaction listener: first click/tap anywhere unlocks audio
    const handleGlobalInteraction = () => {
      if (!userPausedRef.current && audio.paused) {
        startAudio();
      }
    };

    window.addEventListener('click', handleGlobalInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleGlobalInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', handleGlobalInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { capture: true, passive: true });

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlay);
      audio.removeEventListener('pause', handlePause);
      window.removeEventListener('click', handleGlobalInteraction, true);
      window.removeEventListener('pointerdown', handleGlobalInteraction, true);
      window.removeEventListener('keydown', handleGlobalInteraction, true);
      window.removeEventListener('touchstart', handleGlobalInteraction, true);
      // NOTE: Do NOT pause audio on unmount so audio continues across page navigations!
    };
  }, []);

  // Global listeners to prevent closing slider while dragging and close when clicking outside
  useEffect(() => {
    const handlePointerUp = () => {
      setIsDragging(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowControls(false);
      }
    };

    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isDragging) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      if (!isDragging) {
        setShowControls(false);
      }
    }, 450); // Generous 450ms grace period so moving mouse onto slider never flickers
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const audio = getOrCreateAudio();
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      userPausedRef.current = true;
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      audio.muted = false;
      audio.volume = volume;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
          setNeedsInteraction(false);
        })
        .catch((err) => {
          console.warn('Audio play request blocked:', err);
        });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const audio = getOrCreateAudio();
    if (audio) {
      audio.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = getOrCreateAudio();
    if (!audio) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.muted = nextMuted;
  };

  return (
    <div
      ref={containerRef}
      className="relative font-sans text-xs"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Pill: Music Button & Volume Icon Trigger */}
      <div
        className={`rounded-full border transition-all flex items-center shadow-lg backdrop-blur-2xl ${
          isPlaying
            ? 'bg-rose-500/15 text-rose-200 border-rose-500/45 shadow-rose-500/20 ring-1 ring-rose-500/30'
            : needsInteraction
            ? 'bg-gradient-to-r from-rose-500/80 to-rose-600/80 text-white border-rose-400 shadow-rose-500/30 animate-pulse'
            : 'bg-[#0E1422]/35 text-slate-400 border-white/[0.12] hover:border-rose-500/50 hover:text-rose-300'
        }`}
      >
        {/* Main Play/Pause Action */}
        <button
          onClick={togglePlay}
          className="pl-2.5 sm:pl-3 pr-1.5 py-1.5 flex items-center gap-1.5 sm:gap-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
          title={
            isPlaying
              ? 'Pause song'
              : needsInteraction
              ? 'Click to enable ambient music'
              : 'Play song'
          }
        >
          {isPlaying ? (
            <>
              {/* Animated audio visualizer bars */}
              <div className="flex items-center gap-0.5 h-3.5 shrink-0">
                <span className="w-0.5 bg-rose-400 h-2 animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="w-0.5 bg-rose-400 h-3.5 animate-[pulse_0.4s_ease-in-out_infinite]" />
                <span className="w-0.5 bg-rose-400 h-1.5 animate-[pulse_0.8s_ease-in-out_infinite]" />
              </div>
              <span className="hidden sm:inline font-mono text-[11px] text-rose-300 font-bold tracking-wider">
                MUSIC ON
              </span>
              <Pause className="w-3 h-3 text-rose-400 ml-0.5 shrink-0" />
            </>
          ) : needsInteraction ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
              <span className="font-mono text-[11px] text-white font-bold tracking-wider hidden sm:inline">
                PLAY MUSIC
              </span>
              <span className="font-mono text-[10px] text-white font-bold tracking-wider inline sm:hidden">
                MUSIC
              </span>
              <Play className="w-3 h-3 text-white fill-white ml-0.5 shrink-0" />
            </>
          ) : (
            <>
              <Music className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="hidden sm:inline font-mono text-[11px] tracking-wider text-slate-300">
                PAUSED
              </span>
              <Play className="w-3 h-3 text-slate-400 ml-0.5 fill-slate-400 shrink-0" />
            </>
          )}
        </button>

        {/* Dedicated Volume Slider Trigger Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            setShowControls((prev) => !prev);
          }}
          className="pl-1 pr-2.5 py-1.5 text-rose-300/80 hover:text-rose-200 transition-colors cursor-pointer border-l border-white/[0.1]"
          title="Adjust Volume"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-rose-300" />
          )}
        </button>
      </div>

      {/* Floating Seamless Volume Slider & Mute Control */}
      {showControls && (
        <div
          className="absolute right-0 top-full pt-1.5 z-50 animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-[#0E1422]/50 backdrop-blur-3xl border border-white/[0.15] p-3 rounded-2xl shadow-2xl flex items-center gap-2.5 min-w-[190px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.08] to-transparent pointer-events-none" />

            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer relative z-10"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </button>

            <input
              id="ambient-volume-slider"
              name="ambientVolume"
              aria-label="Ambient music volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onPointerDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-[#1E293E]/80 rounded-lg appearance-none cursor-pointer accent-rose-500 relative z-10"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />

            <span className="text-xs font-mono text-rose-300 font-bold min-w-[32px] text-right relative z-10">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
