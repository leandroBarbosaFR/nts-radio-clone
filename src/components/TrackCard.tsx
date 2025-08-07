"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePlayer } from "./PlayerProvider";
import { FaPlay, FaPause } from "react-icons/fa";

export interface TrackCardProps {
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
}

export const TrackCard = ({
  title,
  artist,
  coverImage,
  audioUrl,
}: TrackCardProps) => {
  const { playTrack, currentTrack, isPlaying, pause } = usePlayer();

  const isCurrent = currentTrack?.audioUrl === audioUrl;

  const handleClick = () => {
    if (isCurrent && isPlaying) {
      pause();
    } else {
      playTrack({ title, artist, coverImage, audioUrl });
    }
  };

  return (
    <div className="bg-black text-white border border-neutral-800 p-4 flex flex-col gap-2">
      <Image
        src={coverImage}
        alt={title}
        width={300}
        height={300}
        className="w-full h-auto object-cover"
      />
      <div className="text-xl font-semibold font-mono uppercase tracking-wide">
        {title}
      </div>
      <div className="text-sm text-neutral-400 italic">{artist}</div>
      <Button
        onClick={handleClick}
        className="mt-2 w-full text-black bg-white hover:bg-neutral-300 flex items-center justify-center gap-2"
      >
        {isCurrent && isPlaying ? <FaPause /> : <FaPlay />}
        {isCurrent && isPlaying ? "Pause" : "Play"}
      </Button>
    </div>
  );
};
