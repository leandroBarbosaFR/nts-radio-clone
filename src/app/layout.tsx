// app/layout.tsx

import "./globals.css";
import { MassiliaHeader } from "@/components/MassiliaHeader";
import { PlayerProvider } from "@/components/PlayerProvider";
import { PlayerBar } from "@/components/PlayerBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Massilia Radio",
  description: "Écoutez les meilleurs sets depuis Marseille.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-black text-white font-mono">
        <PlayerProvider>
          <MassiliaHeader />
          <main className="pt-14">{children}</main>
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
