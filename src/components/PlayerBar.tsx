// "use client";
// import { usePlayer } from "./PlayerProvider";
// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import { FaPlay, FaPause, FaBackward, FaForward } from "react-icons/fa";
// import { useCallback } from "react";

// export const PlayerBar = () => {
//   const { currentTrack, isPlaying, pause, resume, previousTrack, nextTrack } =
//     usePlayer();

//   // Handlers avec useCallback pour éviter les re-renders inutiles
//   const handlePlayPause = useCallback(() => {
//     console.log("PlayerBar: Play/Pause clicked");
//     if (isPlaying) {
//       pause();
//     } else {
//       resume();
//     }
//   }, [isPlaying, pause, resume]);

//   const handlePrevious = useCallback(() => {
//     console.log("PlayerBar: Previous clicked");
//     previousTrack();
//   }, [previousTrack]);

//   const handleNext = useCallback(() => {
//     console.log("PlayerBar: Next clicked");
//     nextTrack();
//   }, [nextTrack]);

//   // Ne pas afficher la barre si aucune piste n'est chargée
//   if (!currentTrack) {
//     console.log("PlayerBar: Pas de piste actuelle, masqué");
//     return null;
//   }

//   return (
//     <div className="fixed bottom-0 left-0 w-full bg-black text-white border-t border-white p-3 flex items-center justify-between z-50 font-mono">
//       <div className="flex items-center gap-4">
//         <div className="relative w-[50px] h-[50px] overflow-hidden rounded">
//           <Image
//             src={currentTrack.coverImage}
//             alt={`Cover de ${currentTrack.title}`}
//             fill
//             className="object-cover"
//             sizes="50px"
//             onError={(e) => {
//               console.error(
//                 "Erreur chargement image:",
//                 currentTrack.coverImage
//               );
//               // Image de fallback si l'image ne charge pas
//               const target = e.target as HTMLImageElement;
//               target.style.display = "none";
//             }}
//           />
//         </div>

//         <div className="w-[200px] min-w-0">
//           <div className="text-sm font-bold uppercase truncate">
//             {currentTrack.title}
//           </div>
//           <div className="text-xs text-neutral-400 italic truncate">
//             {currentTrack.artist}
//           </div>
//         </div>
//       </div>

//       <div className="flex items-center gap-2">
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={handlePrevious}
//           className="text-white rounded-none hover:text-[#191919] transition-colors"
//           aria-label="Piste précédente"
//         >
//           <FaBackward size={16} />
//         </Button>

//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={handlePlayPause}
//           className="text-white rounded-none hover:text-[#191919] transition-colors px-4"
//           aria-label={isPlaying ? "Pause" : "Lecture"}
//         >
//           {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
//         </Button>

//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={handleNext}
//           className="text-white rounded-none hover:text-[#191919] transition-colors"
//           aria-label="Piste suivante"
//         >
//           <FaForward size={16} />
//         </Button>
//       </div>

//       {/* Indicateur de statut pour debug */}
//       <div className="hidden w-[200px] min-w-0 md:block text-xs text-neutral-500">
//         {isPlaying ? "En cours" : "En pause"}
//       </div>
//     </div>
//   );
// };
"use client";
import { usePlayer } from "./PlayerProvider";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FaPlay, FaPause, FaBackward, FaForward } from "react-icons/fa";
import { useCallback } from "react";

export const PlayerBar = () => {
  const { currentTrack, isPlaying, pause, resume, previousTrack, nextTrack } =
    usePlayer();

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handlePrevious = useCallback(() => {
    previousTrack();
  }, [previousTrack]);

  const handleNext = useCallback(() => {
    nextTrack();
  }, [nextTrack]);

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full bg-black text-white border-t border-white p-3 flex items-center justify-between z-50 font-mono">
        <div className="flex items-center gap-4">
          <div className="relative w-[50px] h-[50px] overflow-hidden rounded">
            <Image
              src={currentTrack.coverImage}
              alt={`Cover de ${currentTrack.title}`}
              fill
              className="object-cover"
              sizes="50px"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>

          <div className="w-[200px] min-w-0">
            <div className="text-sm font-bold uppercase truncate">
              {currentTrack.title}
            </div>
            <div className="text-xs text-neutral-400 italic truncate">
              {currentTrack.artist}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="text-white rounded-none hover:text-[#191919]"
            aria-label="Piste précédente"
          >
            <FaBackward size={16} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="text-white rounded-none hover:text-[#191919] px-4"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="text-white rounded-none hover:text-[#191919]"
            aria-label="Piste suivante"
          >
            <FaForward size={16} />
          </Button>
        </div>

        <div className="hidden md:block text-xs text-neutral-500 w-[200px]">
          {isPlaying ? "En cours" : "En pause"}
        </div>
      </div>

      {/* SoundCloud Player */}
      {currentTrack.audioUrl.includes("soundcloud.com") && (
        <div className="fixed bottom-[72px] left-0 w-fit z-40">
          <iframe
            width="100%"
            height="120"
            allow="autoplay"
            frameBorder="no"
            scrolling="no"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
              currentTrack.audioUrl
            )}&color=%23000000&auto_play=true`}
            className="rounded-none"
          />
        </div>
      )}
    </>
  );
};
