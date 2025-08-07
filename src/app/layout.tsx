import "./globals.css";
import { MassiliaHeader } from "@/components/MassiliaHeader";
import { PlayerProvider } from "@/components/PlayerProvider";
import { PlayerBar } from "@/components/PlayerBar";

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
          <main className="pt-14">{children}</main>{" "}
          {/* Décale ton contenu sous le header */}
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
