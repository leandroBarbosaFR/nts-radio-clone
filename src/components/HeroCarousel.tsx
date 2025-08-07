"use client";
import React, { useState, useEffect } from "react";
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
  const { currentTrack, isPlaying, playTrack, pause, resume } = usePlayer();

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto-advance slides uniquement si pas en cours de lecture
  useEffect(() => {
    if (slides.length === 0 || isPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isPlaying]);

  const handlePlayTrack = () => {
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return;

    const track = {
      title: currentSlideData.title,
      artist: currentSlideData.artist,
      audioUrl: currentSlideData.audio_url,
      coverImage: currentSlideData.cover_image,
    };

    const isCurrentTrack = currentTrack?.audioUrl === track.audioUrl;

    if (isCurrentTrack) {
      isPlaying ? pause() : resume();
    } else {
      console.log("Lecture depuis le carousel:", track);
      playTrack(track, [track]); // On peut passer juste cette piste ou toutes les slides
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
        <Image
          src={currentSlideData.cover_image}
          alt={`Background for ${currentSlideData.title}`}
          fill
          className="object-cover"
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
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#0000002b]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            {/* Genre Badge */}
            <div className="inline-block bg-white text-black px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
              {currentSlideData.genre}
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-mono uppercase tracking-tight">
              {currentSlideData.title}
            </h1>

            {/* Artist */}
            <h2 className="text-xl md:text-2xl text-gray-300 mb-4 font-mono">
              BY {currentSlideData.artist.toUpperCase()}
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              {currentSlideData.description ||
                `Latest ${currentSlideData.genre} track from ${currentSlideData.artist}`}
            </p>

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
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-12 h-1 transition-all ${
                index === currentSlide
                  ? "bg-white"
                  : "bg-white bg-opacity-40 hover:bg-opacity-60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800 z-20">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
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
