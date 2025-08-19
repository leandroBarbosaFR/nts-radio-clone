// components/DJDashboard.tsx
"use client";
import { useState, useEffect } from "react";
import {
  FaSignOutAlt,
  FaUpload,
  FaEdit,
  FaTrash,
  FaMusic,
} from "react-icons/fa";
import { TrackModal } from "./TrackModal";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "dj";
}

interface TrackData {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  duration: string;
  audio_url?: string;
  cover_image?: string;
  soundcloudUrl?: string; // Interface en camelCase
  is_published: boolean; // Base de données en snake_case
  created_at: string; // Base de données en snake_case
  uploadedBy?: string;
}

interface DJDashboardProps {
  user: User;
  onLogout: () => void;
}

export const DJDashboard = ({ user, onLogout }: DJDashboardProps) => {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrackData | undefined>();
  const [loading, setLoading] = useState(true);

  // Fetch tracks from API
  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch("/api/dj/tracks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("djToken")}`,
        },
      });
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrack = async (formData: FormData) => {
    const endpoint = editingTrack
      ? "/api/dj/tracks/update"
      : "/api/dj/tracks/upload";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("djToken")}`,
      },
      body: formData,
    });

    if (response.ok) {
      await fetchTracks();
      setShowTrackModal(false);
      setEditingTrack(undefined);
    } else {
      throw new Error("Upload failed");
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("Supprimer cette track ?")) return;

    try {
      const response = await fetch("/api/dj/tracks/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("djToken")}`,
        },
        body: JSON.stringify({ trackId }),
      });

      if (response.ok) {
        await fetchTracks();
      }
    } catch (error) {
      console.error("Error deleting track:", error);
    }
  };

  // components/DJDashboard.tsx
  const handleTogglePublish = async (
    trackId: string,
    currentStatus: boolean
  ) => {
    if (user.role !== "admin") return;

    try {
      const response = await fetch("/api/dj/tracks/toggle-publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("djToken")}`,
        },
        // ⬇️ use snake_case to match the API
        body: JSON.stringify({ trackId, is_published: !currentStatus }),
      });

      if (response.ok) {
        await fetchTracks();
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Toggle publish failed:", err);
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <FaMusic className="text-white text-2xl" />
              <div>
                <h1 className="text-2xl font-bold font-mono">DJ DASHBOARD</h1>
                <p className="text-gray-400 font-mono text-sm">
                  Welcome, {user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-mono bg-white text-black px-2 py-1">
                {user.role.toUpperCase()}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 border border-white hover:bg-white hover:text-black font-mono"
              >
                <FaSignOutAlt />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm text-gray-400">TOTAL TRACKS</h3>
            <p className="font-mono text-2xl font-bold">{tracks.length}</p>
          </div>
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm text-gray-400">PUBLISHED</h3>
            <p className="font-mono text-2xl font-bold text-green-400">
              {tracks.filter((t) => t.is_published).length}
            </p>
          </div>
          <div className="border border-white p-4">
            <h3 className="font-mono text-sm text-gray-400">PENDING</h3>
            <p className="font-mono text-2xl font-bold text-yellow-400">
              {tracks.filter((t) => !t.is_published).length}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold font-mono">YOUR TRACKS</h2>
            <p className="text-gray-400 font-mono text-sm">
              {loading ? "Loading..." : `${tracks.length} tracks uploaded`}
            </p>
          </div>

          <button
            onClick={() => setShowTrackModal(true)}
            className="bg-white text-black px-6 py-2 font-mono font-semibold hover:bg-gray-200 flex items-center gap-2"
          >
            <FaUpload />
            UPLOAD TRACK
          </button>
        </div>

        {/* Tracks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="border border-white p-8">
              <p className="font-mono">Loading tracks...</p>
            </div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12">
            <div className="border border-white p-8">
              <FaMusic className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="font-mono text-gray-400 mb-4">
                No tracks uploaded yet
              </p>
              <button
                onClick={() => setShowTrackModal(true)}
                className="bg-white text-black px-6 py-2 font-mono font-semibold hover:bg-gray-200"
              >
                UPLOAD YOUR FIRST TRACK
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="border border-white p-6 hover:bg-gray-900"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Track Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold font-mono text-lg">
                          {track.title}
                        </h3>
                        <p className="text-gray-400 font-mono text-sm">
                          {track.artist}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTrack(track);
                            setShowTrackModal(true);
                          }}
                          className="text-gray-400 hover:text-white p-2 border border-gray-600 hover:border-white"
                          title="Edit track"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(track.id)}
                          className="text-gray-400 hover:text-red-400 p-2 border border-gray-600 hover:border-red-400"
                          title="Delete track"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono text-gray-400">
                      {track.genre && (
                        <div>
                          <span className="block text-gray-500">Genre:</span>
                          <span className="bg-gray-800 px-2 py-1 text-xs">
                            {track.genre}
                          </span>
                        </div>
                      )}
                      {track.duration && (
                        <div>
                          <span className="block text-gray-500">Duration:</span>
                          <span>{track.duration}</span>
                        </div>
                      )}
                      <div>
                        <span className="block text-gray-500">Status:</span>
                        <span
                          className={
                            track.is_published
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {track.is_published ? "PUBLISHED" : "PENDING"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500">Uploaded:</span>
                        <span>
                          {new Date(track.created_at).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Admin controls */}
                    {user.role === "admin" && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() =>
                            handleTogglePublish(track.id, track.is_published)
                          }
                          className={`px-4 py-2 font-mono text-sm border ${
                            track.is_published
                              ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
                              : "border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
                          }`}
                        >
                          {track.is_published ? "UNPUBLISH" : "PUBLISH"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Track Modal */}
      {showTrackModal && (
        <TrackModal
          isOpen={showTrackModal}
          onClose={() => {
            setShowTrackModal(false);
            setEditingTrack(undefined);
          }}
          onSave={handleSaveTrack}
          track={editingTrack}
        />
      )}
    </div>
  );
};
