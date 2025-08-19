"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DJDashboard } from "@/components/DJDashboard";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "dj";
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem("djToken");
    const userData = localStorage.getItem("djUser");

    if (!token || !userData) {
      // Pas connecté, rediriger vers l'accueil
      router.push("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      // Données corrompues, nettoyer et rediriger
      localStorage.removeItem("djToken");
      localStorage.removeItem("djUser");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("djToken");
    localStorage.removeItem("djUser");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-mono">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirection en cours
  }

  return <DJDashboard user={user} onLogout={handleLogout} />;
}
