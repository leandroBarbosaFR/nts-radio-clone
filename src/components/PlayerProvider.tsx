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
  playTrack: (track: Track, playlistArg?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
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

  // Créer nextTrack avec useCallback pour éviter la dépendance cyclique
  const nextTrack = useCallback(() => {
    if (!playlist.length) {
      console.log("Pas de playlist disponible");
      return;
    }

    const nextIndex = (currentIndex + 1) % playlist.length;
    console.log(`Passage à la piste suivante: index ${nextIndex}`);
    setCurrentIndex(nextIndex);

    const track = playlist[nextIndex];
    if (track && audioRef.current) {
      const audio = audioRef.current;
      audio.src = track.audioUrl;
      audio.play().catch(console.error);
      setCurrentTrack(track);
    }
  }, [playlist, currentIndex]);

  const previousTrack = useCallback(() => {
    if (!playlist.length) {
      console.log("Pas de playlist disponible");
      return;
    }

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    console.log(`Retour à la piste précédente: index ${prevIndex}`);
    setCurrentIndex(prevIndex);

    const track = playlist[prevIndex];
    if (track && audioRef.current) {
      const audio = audioRef.current;
      audio.src = track.audioUrl;
      audio.play().catch(console.error);
      setCurrentTrack(track);
    }
  }, [playlist, currentIndex]);

  // Gérer les événements audio séparément
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

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [nextTrack]);

  const playTrack = useCallback(
    (track: Track, playlistArg?: Track[]) => {
      if (!audioRef.current) {
        console.log("Pas de référence audio");
        return;
      }

      const audio = audioRef.current;

      if (playlistArg) {
        console.log("Nouvelle playlist définie:", playlistArg);
        setPlaylist(playlistArg);
        const newIndex = playlistArg.findIndex(
          (t) => t.audioUrl === track.audioUrl
        );
        const indexToSet = newIndex !== -1 ? newIndex : 0;
        console.log(`Index de la piste actuelle: ${indexToSet}`);
        setCurrentIndex(indexToSet);
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
    [currentTrack, isPlaying]
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
        playTrack,
        pause,
        resume,
        nextTrack,
        previousTrack,
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
