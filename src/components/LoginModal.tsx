"use client";
import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onLogin(email, password);
      onClose();
      setEmail("");
      setPassword("");
    } catch {
      setError("Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-black border border-white/15 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-mono">LOGIN DJ</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close login modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/60 border border-red-500/60 text-red-100 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-mono mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 bg-black text-white placeholder-gray-500 border border-white/15 focus:border-white/15 focus:outline-none focus:ring-0"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-mono mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 pr-10 py-2 bg-black text-white placeholder-gray-500 border border-white/15 focus:border-white/15 focus:outline-none focus:ring-0"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-white text-black py-2 px-4 font-mono font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "LOADING..." : "LOGIN"}
          </button>
        </div>
      </div>

      {/* Keep inputs black with browser autofill */}
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          box-shadow: 0 0 0px 1000px #000 inset;
          -webkit-box-shadow: 0 0 0px 1000px #000 inset;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};
