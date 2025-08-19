"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { usePlayer } from "./PlayerProvider";
import Image from "next/image";

interface HeroSlide {
  id: string;
  title: string | null;
  artist: string | null;
  description?: string | null;
  audio_url: string | null;
  cover_image: string | null;
  genre: string | null;
  created_at: string | null;
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { currentTrack, isPlaying, playTrack, pause, resume } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/tracks/public", { cache: "no-store" });
        const json = (await res.json()) as { slides?: HeroSlide[] };
        setSlides(Array.isArray(json.slides) ? json.slides : []);
      } catch (err) {
        console.error("HeroCarousel load error:", err);
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(nextSlide, 10000);
    return () => clearInterval(interval);
  }, [slides.length, nextSlide]);

  const handlePlayTrack = () => {
    const s = slides[currentSlide];
    if (!s) return;

    const track = {
      title: s.title ?? "Untitled",
      artist: s.artist ?? "Unknown",
      audioUrl: s.audio_url ?? "",
      coverImage: s.cover_image ?? "",
    };

    if (!track.audioUrl) {
      console.warn("Track has no audio_url, cannot play.");
      return;
    }

    const heroTracks = slides.map((slide) => ({
      title: slide.title ?? "Untitled",
      artist: slide.artist ?? "Unknown",
      audioUrl: slide.audio_url ?? "",
      coverImage: slide.cover_image ?? "",
    }));

    const isCurrentTrack = currentTrack?.audioUrl === track.audioUrl;
    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      playTrack(track, heroTracks);
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white font-mono">
          <div className="animate-pulse">LOADING FEATURED TRACKS...</div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white font-mono">
          <h2 className="text-2xl mb-2">NO PUBLISHED TRACKS</h2>
          <p className="text-gray-400 mb-4">
            No tracks have been published yet
          </p>
          <p className="text-sm text-gray-500">
            Tracks must be published by an admin to appear here
          </p>
        </div>
      </div>
    );
  }

  const s = slides[currentSlide];
  const bgSrc =
    s.cover_image && s.cover_image.trim() !== "" ? s.cover_image : null;
  const isCurrentTrackPlaying =
    !!s.audio_url && currentTrack?.audioUrl === s.audio_url && isPlaying;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          {bgSrc ? (
            <Image
              src={bgSrc}
              alt={`Background for ${s.title ?? "track"}`}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority={currentSlide === 0}
              onLoad={() => console.log("✅ Image loaded:", bgSrc)}
              onError={() => console.error("❌ Image load error:", bgSrc)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-block bg-white text-black px-4 py-2 text-sm font-bold uppercase tracking-wider mb-6">
              {s.genre ?? "UNKNOWN"}
            </div>

            <div className="bg-black/70 backdrop-blur-sm p-6 mb-6 border border-white/10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-mono uppercase tracking-tight leading-tight">
                {s.title ?? "UNTITLED"}
              </h1>

              <h2 className="text-lg md:text-xl text-gray-300 mb-4 font-mono">
                BY {(s.artist ?? "Unknown").toUpperCase()}
              </h2>

              <p className="text-gray-300 text-base md:text-lg mb-0 max-w-lg leading-relaxed">
                {s.description ??
                  `Latest ${s.genre ?? "music"} track from ${
                    s.artist ?? "Unknown"
                  }`}
              </p>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handlePlayTrack}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
                disabled={!s.audio_url}
                aria-disabled={!s.audio_url}
                title={!s.audio_url ? "No audio source" : "Play"}
              >
                {isCurrentTrackPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
                {isCurrentTrackPlaying ? "PAUSE" : "PLAY"}
              </button>

              <span className="text-white text-sm font-mono">
                {currentSlide + 1}/{slides.length}
              </span>
            </div>

            <div className="w-[50%] h-[1px] bg-gray-800 z-20">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: `${((currentSlide + 1) / slides.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {isCurrentTrackPlaying && (
        <div className="absolute top-4 right-4 z-20 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
          NOW PLAYING
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
