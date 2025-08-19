// app/api/dj/tracks/update/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Role = "admin" | "dj";
interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

function isAuthPayload(v: unknown): v is AuthPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.userId === "string" &&
    typeof o.email === "string" &&
    (o.role === "admin" || o.role === "dj")
  );
}

function verifyToken(req: NextRequest): AuthPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "your-secret-key"
    );
    if (!isAuthPayload(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Helpers for safe FormData extraction
function getStr(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return typeof v === "string" ? v : undefined;
}
const normalize = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();

    const trackId = getStr(formData, "trackId");
    const title = getStr(formData, "title");
    const artist = getStr(formData, "artist");
    const genre = getStr(formData, "genre");
    const duration = getStr(formData, "duration");
    const soundcloudUrl = getStr(formData, "soundcloudUrl");

    if (!trackId || !title || !artist) {
      return NextResponse.json(
        { error: "ID, titre et artiste requis" },
        { status: 400 }
      );
    }

    console.log("[UPDATE TRACK] User:", user.email, "Track:", trackId);

    // Autorisations: admin = tout, DJ = seulement ses propres tracks
    const whereClause =
      user.role === "admin"
        ? { id: trackId }
        : { id: trackId, uploaded_by: user.userId };

    const existingTrack = await prisma.track.findFirst({ where: whereClause });
    if (!existingTrack) {
      return NextResponse.json(
        { error: "Track non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Mettre à jour la track
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: {
        title: title.trim(),
        artist: artist.trim(),
        genre: normalize(genre),
        duration: normalize(duration),
        soundcloudUrl: normalize(soundcloudUrl),
      },
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        duration: true,
      },
    });

    console.log("[UPDATE TRACK] Track updated:", updatedTrack.title);

    return NextResponse.json({ success: true, track: updatedTrack });
  } catch (error) {
    console.error("[UPDATE TRACK] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
