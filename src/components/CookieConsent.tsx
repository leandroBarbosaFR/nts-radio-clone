"use client";
import { useEffect, useState } from "react";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setTimeout(() => setVisible(true), 500); // délai pour éviter le flash
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem("cookie_consent", "closed");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:left-4 md:bottom-4 z-50 bg-white text-black shadow-lg max-w-md p-6">
      <h2 className="text-lg font-bold mb-2">COOKIES</h2>
      <p className="text-sm mb-4">
        En cliquant sur « Accepter les cookies », vous acceptez le stockage de
        cookies sur votre appareil pour améliorer la navigation, analyser
        l’utilisation du site et soutenir nos efforts marketing.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={handleClose}
          className="text-sm text-gray-600 hover:text-black"
        >
          Fermer
        </button>
        <button
          onClick={handleAccept}
          className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-900 transition-colors"
        >
          Accepter les cookies
        </button>
      </div>
    </div>
  );
};
