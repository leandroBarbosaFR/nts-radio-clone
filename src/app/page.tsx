"use client";
import { useState } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import GenreSidebar from "@/components/GenreSidebar";

import "keen-slider/keen-slider.min.css";

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState("Hip-Hop");

  const handleGenreSelect = (genre: string) => {
    console.log("Genre sélectionné:", genre);
    setSelectedGenre(genre);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex">
      {/* Main Content - Prend tout l'espace disponible */}
      <div className="flex-1">
        <HeroCarousel />
      </div>

      {/* Sidebar - Position fixe à droite */}
      <GenreSidebar
        onGenreSelect={handleGenreSelect}
        selectedGenre={selectedGenre}
      />
    </div>
  );
}
