"use client";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

export interface Track {
  title: string;
  artist: string;
  audioUrl: string;
  coverImage: string;
  soundcloudUrl?: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[]; // Exposer la playlist
  currentIndex: number; // Exposer l'index actuel
  playTrack: (track: Track, playlistArg?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setPlaylist: (tracks: Track[]) => void; // Nouvelle méthode pour définir la playlist
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser l'audio une seule fois
  useEffect(() => {
    if (typeof Audio !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Fonction utilitaire pour jouer une piste par index
  const playTrackByIndex = useCallback(
    (index: number) => {
      if (!playlist.length || index < 0 || index >= playlist.length) {
        console.log("Index invalide ou playlist vide:", {
          index,
          playlistLength: playlist.length,
        });
        return;
      }

      const track = playlist[index];
      if (track && audioRef.current) {
        const audio = audioRef.current;
        audio.src = track.audioUrl;
        audio.play().catch((error) => {
          console.error("Erreur de lecture:", error);
        });
        setCurrentTrack(track);
        setCurrentIndex(index);
        console.log(
          `Lecture de la piste ${index + 1}/${playlist.length}: ${track.title}`
        );
      }
    },
    [playlist]
  );

  const nextTrack = useCallback(() => {
    if (!playlist.length) {
      console.log("Pas de playlist disponible pour next");
      return;
    }

    const nextIndex = (currentIndex + 1) % playlist.length;
    console.log(
      `Passage à la piste suivante: index ${currentIndex} -> ${nextIndex}`
    );
    playTrackByIndex(nextIndex);
  }, [playlist.length, currentIndex, playTrackByIndex]);

  const previousTrack = useCallback(() => {
    if (!playlist.length) {
      console.log("Pas de playlist disponible pour previous");
      return;
    }

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    console.log(
      `Retour à la piste précédente: index ${currentIndex} -> ${prevIndex}`
    );
    playTrackByIndex(prevIndex);
  }, [playlist.length, currentIndex, playTrackByIndex]);

  // Gérer les événements audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log("Audio play event");
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log("Audio pause event");
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log("Piste terminée, passage à la suivante");
      setIsPlaying(false);
      nextTrack();
    };

    const handleError = (e: Event) => {
      console.error("Erreur audio:", e);
      setIsPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [nextTrack]);

  const playTrack = useCallback(
    (track: Track, playlistArg?: Track[]) => {
      if (!audioRef.current) {
        console.log("Pas de référence audio");
        return;
      }

      const audio = audioRef.current;

      // Si une nouvelle playlist est fournie, la définir
      if (playlistArg && playlistArg.length > 0) {
        console.log("Nouvelle playlist définie:", playlistArg.length, "pistes");
        setPlaylist(playlistArg);

        // Trouver l'index de la piste dans la nouvelle playlist
        const newIndex = playlistArg.findIndex(
          (t) => t.audioUrl === track.audioUrl
        );
        const indexToSet = newIndex !== -1 ? newIndex : 0;
        console.log(
          `Index de la piste actuelle dans la nouvelle playlist: ${indexToSet}`
        );
        setCurrentIndex(indexToSet);
      } else if (playlist.length > 0) {
        // Si pas de nouvelle playlist mais qu'on en a une, chercher l'index
        const existingIndex = playlist.findIndex(
          (t) => t.audioUrl === track.audioUrl
        );
        if (existingIndex !== -1) {
          setCurrentIndex(existingIndex);
          console.log(
            `Piste trouvée dans la playlist existante à l'index: ${existingIndex}`
          );
        }
      }

      const isSameTrack = currentTrack?.audioUrl === track.audioUrl;

      if (isSameTrack && isPlaying) {
        console.log("Même piste en cours, pause");
        audio.pause();
      } else {
        console.log("Lecture de la piste:", track.title);
        audio.src = track.audioUrl;
        audio.play().catch((error) => {
          console.error("Erreur de lecture:", error);
        });
        setCurrentTrack(track);
      }
    },
    [currentTrack, isPlaying, playlist]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      console.log("Pause manuelle");
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && currentTrack) {
      console.log("Reprise de la lecture");
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrack]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playlist,
        currentIndex,
        playTrack,
        pause,
        resume,
        nextTrack,
        previousTrack,
        setPlaylist,
        audioRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
