"use client";
import React, { useState, useEffect } from "react";
import { Play, Plus } from "lucide-react";
import { supabase } from "../lib/supabase/client";
import { usePlayer } from "./PlayerProvider";

interface GenreData {
  genre: string;
  count: number;
  sample_track?: {
    title: string;
    artist: string;
    cover_image: string;
    audio_url: string;
  };
}

interface GenreSidebarProps {
  onGenreSelect: (genre: string) => void;
  selectedGenre?: string;
}

const GenreSidebar: React.FC<GenreSidebarProps> = ({
  onGenreSelect,
  selectedGenre = "Hip-Hop",
}) => {
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack } = usePlayer();

  // Couleurs prédéfinies pour les genres
  const genreColors = {
    "Hip-Hop": "from-blue-600 to-purple-600",
    Latin: "from-green-500 to-teal-600",
    Dance: "from-pink-500 to-orange-500",
    Electronic: "from-gray-600 to-gray-800",
    Jazz: "from-indigo-500 to-blue-600",
    Rock: "from-red-600 to-pink-600",
    Pop: "from-yellow-600 to-orange-600",
    Classical: "from-purple-600 to-pink-600",
    Reggae: "from-amber-600 to-yellow-500",
  };

  const getGenreColor = (genre: string): string => {
    return (
      genreColors[genre as keyof typeof genreColors] ||
      "from-gray-500 to-gray-700"
    );
  };

  const getGenreDisplayName = (genre: string): string => {
    const displayNames = {
      "Hip-Hop": "HIP HOP",
      Latin: "LATIN VIBES",
      Dance: "DANCE FLOOR",
      Electronic: "ELECTRONIC",
      Jazz: "JAZZ LOUNGE",
      Rock: "ROCK ANTHEMS",
      Pop: "POP HITS",
      Classical: "CLASSICAL",
      Reggae: "REGGAE VIBES",
    };
    return (
      displayNames[genre as keyof typeof displayNames] || genre.toUpperCase()
    );
  };

  const getGenreDescription = (genre: string): string => {
    const descriptions = {
      "Hip-Hop": "Urban beats and street stories",
      Latin: "Sertanejo and Latin rhythms",
      Dance: "Electronic dance music hits",
      Electronic: "Digital soundscapes and synths",
      Jazz: "Smooth and sophisticated sounds",
      Rock: "Electric guitars and powerful vocals",
      Pop: "Chart-topping mainstream hits",
      Classical: "Orchestral and instrumental pieces",
      Reggae: "Island rhythms and positive vibes",
    };
    return (
      descriptions[genre as keyof typeof descriptions] ||
      `${genre} music collection`
    );
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setIsLoading(true);
        console.log("Récupération des genres...");

        // Récupérer tous les genres distincts avec le nombre de pistes
        const { data: genreCountData, error: genreError } = await supabase
          .from("tracks")
          .select("genre")
          .not("genre", "is", null);

        if (genreError) throw genreError;

        // Compter les pistes par genre
        const genreCounts: { [key: string]: number } = {};
        genreCountData.forEach((item) => {
          if (item.genre) {
            genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
          }
        });

        // Récupérer une piste d'exemple pour chaque genre (pour l'image de couverture)
        const genresWithSamples: GenreData[] = [];

        for (const [genre, count] of Object.entries(genreCounts)) {
          const { data: sampleTrack, error: sampleError } = await supabase
            .from("tracks")
            .select("title, artist, cover_image, audio_url")
            .eq("genre", genre)
            .limit(1)
            .single();

          if (!sampleError && sampleTrack) {
            genresWithSamples.push({
              genre,
              count,
              sample_track: sampleTrack,
            });
          } else {
            genresWithSamples.push({
              genre,
              count,
            });
          }
        }

        console.log("Genres récupérés:", genresWithSamples);
        setGenres(genresWithSamples);
      } catch (err) {
        console.error("Erreur lors du chargement des genres:", err);
        setGenres([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreClick = (genre: string) => {
    console.log("Genre sélectionné:", genre);
    onGenreSelect(genre);
  };

  const handlePlayGenre = async (genre: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher la sélection du genre

    try {
      // Récupérer une piste aléatoire de ce genre
      const { data: randomTrack, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("genre", genre)
        .limit(1)
        .single();

      if (error) throw error;

      if (randomTrack) {
        const track = {
          title: randomTrack.title,
          artist: randomTrack.artist,
          audioUrl: randomTrack.audio_url,
          coverImage: randomTrack.cover_image,
        };

        console.log("Lecture du genre:", genre, track);
        playTrack(track, [track]);
      }
    } catch (err) {
      console.error("Erreur lors de la lecture du genre:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 h-screen bg-black text-white overflow-y-auto border-l border-white">
        <div className="flex items-center justify-center h-full">
          <div className="text-center font-mono">
            <div className="animate-pulse text-sm">LOADING GENRES...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-screen bg-black text-white overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700 border-l border-white">
      {/* Header */}
      <div className="p-4 border-b border-white">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-2">
          Radio Genres
        </h2>
        <p className="text-xs text-gray-500">
          {genres.length} genres available
        </p>
      </div>

      {/* Genre Grid */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {genres.map((genreData) => (
          <div
            key={genreData.genre}
            className={`relative group cursor-pointer ${
              selectedGenre === genreData.genre ? "ring-2 ring-white" : ""
            }`}
            onMouseEnter={() => setHoveredGenre(genreData.genre)}
            onMouseLeave={() => setHoveredGenre(null)}
            onClick={() => handleGenreClick(genreData.genre)}
          >
            {/* Genre Card */}
            <div className="relative aspect-square overflow-hidden bg-gray-900 border border-white hover:border-white transition-all duration-300">
              {/* Background Image */}
              {genreData.sample_track?.cover_image && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{
                    backgroundImage: `url(${genreData.sample_track.cover_image})`,
                  }}
                />
              )}

              {/* Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getGenreColor(
                  genreData.genre
                )} opacity-70 group-hover:opacity-60 transition-opacity`}
              />

              {/* Content */}
              <div className="relative z-10 h-full p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider leading-tight mb-1">
                    {getGenreDisplayName(genreData.genre)}
                  </h3>
                  {hoveredGenre === genreData.genre && (
                    <p className="text-xs text-gray-200 leading-tight">
                      {getGenreDescription(genreData.genre)}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-mono">
                    {genreData.count} tracks
                  </span>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    <button
                      className="w-6 h-6 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-sm flex items-center justify-center transition-all"
                      onClick={(e) => handlePlayGenre(genreData.genre, e)}
                      title={`Play ${genreData.genre}`}
                    >
                      <Play size={12} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Overlay */}
              {selectedGenre === genreData.genre && (
                <div className="absolute inset-0 bg-opacity-10 z-5" />
              )}

              {/* Hover Overlay */}
              {hoveredGenre === genreData.genre && (
                <div className="absolute inset-0 bg-black bg-opacity-20 z-5" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {genres.length === 0 && !isLoading && (
        <div className="p-4 text-center text-gray-400">
          <p className="text-sm">No genres found</p>
          <p className="text-xs mt-1">Add some tracks to your database</p>
        </div>
      )}

      {/* Bottom Actions */}
      {genres.length > 0 && (
        <div className="p-4 border-t border-white mt-4">
          <div className="text-center text-xs text-gray-500 mb-2">
            Total: {genres.reduce((sum, g) => sum + g.count, 0)} tracks
          </div>
        </div>
      )}
    </div>
  );
};

export default GenreSidebar;
