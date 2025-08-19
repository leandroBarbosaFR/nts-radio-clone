// components/MassiliaHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "./PlayerProvider";
import { Track } from "./PlayerProvider";
import {
  FaPause,
  FaPlay,
  FaVolumeUp,
  FaVolumeMute,
  FaBackward,
  FaForward,
  FaUser,
} from "react-icons/fa";
import { LoginModal } from "./LoginModal";

// ---- Types ----
interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "dj";
}

interface RadioApiItem {
  title: string | null;
  artist: string | null;
  audio_url: string | null;
  cover_image: string | null;
  soundcloud_url?: string | null;
}
interface RadiosApiResponse {
  data: unknown;
}

function isRadioApiItem(v: unknown): v is RadioApiItem {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  const isNullableString = (x: unknown) =>
    x === null || typeof x === "string" || typeof x === "undefined";
  return (
    isNullableString(o.title) &&
    isNullableString(o.artist) &&
    isNullableString(o.audio_url) &&
    isNullableString(o.cover_image) &&
    isNullableString(o.soundcloud_url)
  );
}

export const MassiliaHeader = () => {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    pause,
    resume,
    playTrack,
    nextTrack,
    previousTrack,
    setPlaylist,
    audioRef,
  } = usePlayer();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Load persisted session (if any)
  useEffect(() => {
    const token = localStorage.getItem("djToken");
    const userData = localStorage.getItem("djUser");
    if (token && userData) {
      try {
        const parsed: User = JSON.parse(userData);
        setUser(parsed);
      } catch {
        localStorage.removeItem("djToken");
        localStorage.removeItem("djUser");
      }
    }
  }, []);

  // Login
  const handleLogin = async (email: string, password: string) => {
    const response = await fetch("/api/dj/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data: { token: string; user: User } = await response.json();
      localStorage.setItem("djToken", data.token);
      localStorage.setItem("djUser", JSON.stringify(data.user));
      setUser(data.user);
      router.push("/dashboard");
    } else {
      throw new Error("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("djToken");
    localStorage.removeItem("djUser");
    setUser(null);
    router.push("/");
  };

  // Fetch radios (once)
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let isMounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/radios");
        const json = (await res.json()) as RadiosApiResponse;

        const data =
          json &&
          typeof json === "object" &&
          Array.isArray((json as { data?: unknown }).data)
            ? ((json as { data: unknown[] }).data as unknown[])
            : [];

        const formattedTracks: Track[] = data
          .filter(isRadioApiItem)
          .map((t) => ({
            title: t.title ?? "Untitled",
            artist: t.artist ?? "Unknown",
            audioUrl: t.audio_url ?? "",
            coverImage: t.cover_image ?? "",
            soundcloudUrl: t.soundcloud_url ?? undefined,
          }));

        if (!isMounted) return;

        setTracks(formattedTracks);
        if (formattedTracks.length > 0) setPlaylist(formattedTracks);
      } catch (e) {
        console.error("Erreur de chargement des radios:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [setPlaylist]);

  // Volume slider UI
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".volume-slider")) setShowVolumeSlider(false);
    };
    if (showVolumeSlider)
      document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showVolumeSlider]);

  useEffect(() => {
    if (audioRef?.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [audioRef, isMuted, volume]);

  const toggleVolumeSlider = () => setShowVolumeSlider((p) => !p);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const handlePlayPause = () => {
    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0], tracks);
    } else if (currentTrack) {
      isPlaying ? pause() : resume();
    }
  };

  const handleNext = useCallback(() => {
    if (tracks.length > 0) nextTrack();
  }, [tracks.length, nextTrack]);

  const handlePrevious = useCallback(() => {
    if (tracks.length > 0) previousTrack();
  }, [tracks.length, previousTrack]);

  return (
    <>
      <div className="w-full z-1000 fixed bg-black text-white border-b border-white flex items-center px-4 h-[70px] text-sm font-mono select-none">
        <div className="flex items-center gap-4">
          <Link href="/" className="block" aria-label="Massilia Radio - Home">
            <Image
              src="https://cdn.sanity.io/media-libraries/mllo1PEUbcwG/images/ec2169739c8becafebc32ea4cfd72ecf556252dd-500x500.png"
              alt="Massilia Radio"
              width={70}
              height={70}
              priority
              className="h-[70px] w-[70px] object-contain"
            />
          </Link>

          <div className="flex items-center bg-white text-black px-2 py-1 uppercase font-semibold relative">
            <span className="mr-4">Live Now</span>
            <span
              className="w-3 h-3 rounded-full bg-red-600 animate-pulse absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Live indicator"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-white text-black px-2">
              {isLoading ? "..." : tracks.length}
            </span>

            <button
              onClick={handlePrevious}
              className="hover:text-neutral-300 disabled:opacity-50"
              disabled={tracks.length === 0}
            >
              <FaBackward />
            </button>

            <button
              onClick={handlePlayPause}
              className="hover:text-neutral-300 disabled:opacity-50"
              disabled={tracks.length === 0}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <button
              onClick={handleNext}
              className="hover:text-neutral-300 disabled:opacity-50"
              disabled={tracks.length === 0}
            >
              <FaForward />
            </button>

            <span className="truncate max-w-[200px]">
              {currentTrack?.title || "Cliquez sur play pour commencer"}
            </span>

            {currentTrack && (
              <span className="text-xs text-neutral-400">
                par {currentTrack.artist}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4 relative">
          <span className="hidden md:inline text-xs text-neutral-400">
            Marseille
          </span>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 hover:text-neutral-300 text-xs"
              >
                <FaUser size={12} />
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs hover:text-neutral-300 px-2 py-1 border border-white"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-1 hover:text-neutral-300 text-xs border border-white px-2 py-1"
            >
              <FaUser size={12} />
              Login
            </button>
          )}

          <button
            onClick={toggleVolumeSlider}
            className="hover:text-neutral-300"
          >
            {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>

          {showVolumeSlider && (
            <div
              className="absolute volume-slider top-full right-0 mt-2 bg-black/90 backdrop-blur border border-white/20 rounded-lg p-2 flex items-center justify-center"
              style={{ width: 24, height: 120 }}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="vertical-range"
              />
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      <style jsx>{`
        .vertical-range {
          -webkit-appearance: none;
          width: 110px;
          height: 4px;
          transform: rotate(-90deg);
          border-radius: 8px;
          background: linear-gradient(
            to right,
            #ffffff 0%,
            #ffffff ${(isMuted ? 0 : volume) * 100}%,
            #525252 ${(isMuted ? 0 : volume) * 100}%,
            #525252 100%
          );
          cursor: pointer;
        }
        .vertical-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          margin-left: -4px;
        }
        .vertical-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          margin-left: -4px;
        }
        .vertical-range:focus {
          outline: none;
        }
      `}</style>
    </>
  );
};
