"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// Import dynamique pour éviter le prerendering SSR
const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-pulse font-mono">LOADING...</div>
    </div>
  ),
});

const GenreSidebar = dynamic(() => import("@/components/GenreSidebar"), {
  ssr: false,
});

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState("Hip-Hop");

  const handleGenreSelect = (genre: string) => {
    console.log("Genre sélectionné:", genre);
    setSelectedGenre(genre);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col lg:flex-row">
      {/* Main Content */}
      <div className="flex-1">
        <HeroCarousel />
      </div>

      {/* Sidebar */}
      <GenreSidebar
        onGenreSelect={handleGenreSelect}
        selectedGenre={selectedGenre}
      />
    </div>
  );
}
