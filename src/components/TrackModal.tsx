// components/TrackModal.tsx
"use client";
import { useState } from "react";
import { FaTimes, FaSave } from "react-icons/fa";

interface TrackData {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  duration: string;
  soundcloudUrl?: string;
  is_published: boolean;
  created_at: string;
}

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave is now optional; we do the API call here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave?: (payload: any) => Promise<void>;
  track?: TrackData;
}

export const TrackModal = ({
  isOpen,
  onClose,
  onSave,
  track,
}: TrackModalProps) => {
  const [formData, setFormData] = useState({
    title: track?.title || "",
    artist: track?.artist || "",
    genre: track?.genre || "",
    duration: track?.duration || "",
    soundcloudUrl: track?.soundcloudUrl || "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const genres = [
    "House",
    "Techno",
    "Deep House",
    "Progressive",
    "Trance",
    "Tech House",
    "Minimal",
    "Breakbeat",
    "Drum & Bass",
    "Other",
  ];

  function getJwt() {
    // adapt to your auth flow
    return localStorage.getItem("dj_token") ?? "";
  }

  async function createSignedUrl({
    bucket,
    folder,
    filename,
    contentType,
  }: {
    bucket: string;
    folder?: string;
    filename: string;
    contentType?: string;
  }) {
    const r = await fetch("/api/uploads/signed-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bucket, folder, filename, contentType }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Failed to create signed URL");
    return j as { signedUrl: string; path: string; publicUrl: string };
  }

  async function uploadToStorage(file: File, bucket: string, folder: string) {
    const { signedUrl, publicUrl } = await createSignedUrl({
      bucket,
      folder,
      filename: file.name,
      contentType: file.type,
    });
    const put = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "content-type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    });
    if (!put.ok) throw new Error("Upload failed");
    return publicUrl; // if bucket is private, return the 'path' instead
  }

  const handleSave = async () => {
    if (!formData.title || !formData.artist) {
      alert("Titre et artiste requis");
      return;
    }
    if (!track && !audioFile) {
      // creating a new track requires audio
      alert("Fichier audio requis");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      // 1) Upload files directly to storage (skip if not provided)
      let audioUrl: string | null = null;
      let coverImageUrl: string | null = null;

      if (audioFile) {
        audioUrl = await uploadToStorage(audioFile, "radio-tracks", "tracks");
      }
      if (coverFile) {
        coverImageUrl = await uploadToStorage(
          coverFile,
          "radio-images",
          "covers"
        );
      }

      // 2) Save metadata (JSON only) to your API
      const payload = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        genre: formData.genre || null,
        duration: formData.duration || null,
        soundcloudUrl: formData.soundcloudUrl || null,
        audioUrl, // may be null when editing w/o new audio
        coverImageUrl, // may be null if no cover selected
        fileSize: audioFile?.size ?? null,
        trackId: track?.id ?? null, // if your API supports update
      };

      const res = await fetch("/api/dj/tracks/upload", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${getJwt()}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Erreur lors de l’enregistrement");

      // Optional: bubble up
      if (onSave) await onSave(json);

      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("Error saving track:", e);
      setErr(e.message || "Erreur lors de la sauvegarde");
      alert(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-black border border-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-mono">
            {track ? "EDIT TRACK" : "UPLOAD TRACK"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-mono mb-2">
                TITRE *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-mono mb-2">
                ARTISTE *
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) =>
                  setFormData({ ...formData, artist: e.target.value })
                }
                className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-mono mb-2">
                GENRE
              </label>
              <select
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
                className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400"
              >
                <option value="">Sélectionner...</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-mono mb-2">
                DURÉE (mm:ss)
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                placeholder="3:45"
                className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-mono mb-2">
              SOUNDCLOUD URL
            </label>
            <input
              type="url"
              value={formData.soundcloudUrl}
              onChange={(e) =>
                setFormData({ ...formData, soundcloudUrl: e.target.value })
              }
              className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-mono mb-2">
              FICHIER AUDIO {track ? "(optionnel)" : "*"}
            </label>
            <input
              type="file"
              accept="audio/mpeg,audio/mp4,audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400 file:bg-white file:text-black file:border-0 file:px-2 file:py-1 file:mr-2"
            />
            {audioFile && (
              <p className="text-gray-400 text-sm mt-1 font-mono">
                Fichier sélectionné: {audioFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white text-sm font-mono mb-2">
              COVER IMAGE
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-black border border-white text-white font-mono focus:outline-none focus:border-gray-400 file:bg-white file:text-black file:border-0 file:px-2 file:py-1 file:mr-2"
            />
            {coverFile && (
              <p className="text-gray-400 text-sm mt-1 font-mono">
                Image sélectionnée: {coverFile.name}
              </p>
            )}
          </div>

          {err && <p className="text-red-400 font-mono">{err}</p>}

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-white text-black py-2 px-4 font-mono font-semibold hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaSave />
              {loading ? "SAVING..." : track ? "UPDATE" : "UPLOAD"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-white text-white font-mono hover:bg-white hover:text-black"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
