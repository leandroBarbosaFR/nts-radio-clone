"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { supabase } from "../lib/supabase/client";
import { usePlayer } from "./PlayerProvider";
import Image from "next/image";

interface HeroSlide {
  id: number;
  title: string;
  artist: string;
  description?: string;
  audio_url: string;
  cover_image: string;
  genre: string;
  created_at: string;
}

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, pause, resume, setPlaylist } =
    usePlayer();

  // Récupérer les données depuis Supabase
  useEffect(() => {
    const fetchFeaturedTracks = async () => {
      try {
        setIsLoading(true);
        console.log("Récupération des pistes featured...");

        // Récupérer quelques pistes aléatoires pour le carousel
        const { data, error } = await supabase
          .from("tracks")
          .select("*")
          .limit(5); // Limite à 5 pistes pour le carousel

        if (error) {
          console.error("Erreur Supabase:", error);
          throw error;
        }

        console.log("Pistes récupérées:", data);
        setSlides(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des pistes featured:", err);
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedTracks();
  }, []);

  // Créer nextSlide avec useCallback pour éviter les re-créations
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance slides uniquement si pas en cours de lecture
  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, [slides.length, isPlaying, nextSlide]);

  const handlePlayTrack = () => {
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return;

    const track = {
      title: currentSlideData.title,
      artist: currentSlideData.artist,
      audioUrl: currentSlideData.audio_url,
      coverImage: currentSlideData.cover_image,
    };

    // Convertir toutes les slides en tracks pour la playlist
    const heroTracks = slides.map((slide) => ({
      title: slide.title,
      artist: slide.artist,
      audioUrl: slide.audio_url,
      coverImage: slide.cover_image,
    }));

    const isCurrentTrack = currentTrack?.audioUrl === track.audioUrl;

    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      console.log("Lecture depuis le carousel:", track);
      // Passer toutes les pistes du hero comme playlist
      playTrack(track, heroTracks);
    }
  };

  // Affichage de loading
  if (isLoading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white font-mono">
          <div className="animate-pulse">LOADING FEATURED TRACKS...</div>
        </div>
      </div>
    );
  }

  // Pas de pistes disponibles
  if (slides.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white font-mono">
          <h2 className="text-2xl mb-2">NO FEATURED TRACKS</h2>
          <p className="text-gray-400">Check your database connection</p>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];
  const isCurrentTrackPlaying =
    currentTrack?.audioUrl === currentSlideData.audio_url && isPlaying;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <Image
            src={currentSlideData.cover_image}
            alt={`Background for ${currentSlideData.title}`}
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority={currentSlide === 0}
            onLoad={() => {
              console.log(
                "✅ Image chargée avec succès:",
                currentSlideData.cover_image
              );
            }}
            onError={() => {
              console.error(
                "❌ Erreur chargement image background:",
                currentSlideData.cover_image
              );
            }}
          />
        </div>

        {/* Dark Overlay - plus prononcé pour créer plus de contraste */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            {/* Genre Badge */}
            <div className="inline-block bg-white text-black px-4 py-2 text-sm font-bold uppercase tracking-wider mb-6">
              {currentSlideData.genre}
            </div>
            <div className="bg-black/70 backdrop-blur-sm p-6 mb-6 border border-white/10">
              {/* Main Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-mono uppercase tracking-tight leading-tight">
                {currentSlideData.title}
              </h1>

              {/* Artist */}
              <h2 className="text-lg md:text-xl text-gray-300 mb-4 font-mono">
                BY {currentSlideData.artist.toUpperCase()}
              </h2>

              {/* Description */}
              <p className="text-gray-300 text-base md:text-lg mb-0 max-w-lg leading-relaxed">
                {currentSlideData.description ||
                  `Latest ${currentSlideData.genre} track from ${currentSlideData.artist}`}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={handlePlayTrack}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
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
            <div>
              <div className=" w-[50%] h-[1px] bg-gray-800 z-20">
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
      </div>

      {/* Now Playing Indicator */}
      {isCurrentTrackPlaying && (
        <div className="absolute top-4 right-4 z-20 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider animate-pulse">
          NOW PLAYING
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
