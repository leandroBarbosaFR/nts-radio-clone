// "use client";
// import { useState } from "react";
// import dynamic from "next/dynamic";

// // Import dynamique pour éviter le prerendering SSR
// const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"), {
//   ssr: false,
//   loading: () => (
//     <div className="min-h-screen bg-black text-white flex items-center justify-center">
//       <div className="animate-pulse font-mono">LOADING...</div>
//     </div>
//   ),
// });

// const GenreSidebar = dynamic(() => import("@/components/GenreSidebar"), {
//   ssr: false,
// });

// export default function Home() {
//   const [selectedGenre, setSelectedGenre] = useState("Hip-Hop");

//   const handleGenreSelect = (genre: string) => {
//     console.log("Genre sélectionné:", genre);
//     setSelectedGenre(genre);
//   };

//   return (
//     <div className="min-h-screen bg-black text-white font-mono flex flex-col lg:flex-row">
//       {/* Main Content */}
//       <div className="flex-1">
//         <HeroCarousel />
//       </div>

//       {/* Sidebar */}
//       <GenreSidebar
//         onGenreSelect={handleGenreSelect}
//         selectedGenre={selectedGenre}
//       />
//     </div>
//   );
// }
"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";

// Import dynamique
const HeroCarousel = dynamic(() => import("@/components/HeroCarousel"), {
  ssr: false,
});
const GenreSidebar = dynamic(() => import("@/components/GenreSidebar"), {
  ssr: false,
});

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState("Hip-Hop");

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col lg:flex-row">
      {/* Élément statique caché pour forcer génération */}
      <span className="sr-only">Massilia Radio Home Page</span>

      {/* Carousel */}
      <div className="flex-1">
        <Suspense fallback={<div className="p-8">Loading hero…</div>}>
          <HeroCarousel />
        </Suspense>
      </div>

      {/* Sidebar */}
      <Suspense fallback={<div className="p-8">Loading genres…</div>}>
        <GenreSidebar
          onGenreSelect={handleGenreSelect}
          selectedGenre={selectedGenre}
        />
      </Suspense>
    </div>
  );
}
