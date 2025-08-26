// app/api/dj/tracks/upload/route.ts
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
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET ?? "your-secret-key"
    );
    return isAuthPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

const norm = (v?: string | null) =>
  v && String(v).trim() !== "" ? String(v).trim() : null;

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      artist,
      genre,
      duration,
      soundcloudUrl,
      audioUrl, // <- already uploaded to storage
      coverImageUrl, // <- already uploaded to storage
      fileSize, // number from client
    } = body;

    if (!title || !artist) {
      return NextResponse.json(
        { error: "Titre et artiste requis" },
        { status: 400 }
      );
    }

    const track = await prisma.track.create({
      data: {
        title: String(title).trim(),
        artist: String(artist).trim(),
        genre: norm(genre),
        duration: norm(duration),
        soundcloudUrl: norm(soundcloudUrl),
        audio_url: norm(audioUrl),
        cover_image: norm(coverImageUrl),
        uploaded_by: user.userId,
        is_published: false,
        file_size: fileSize != null ? BigInt(fileSize) : null,
      },
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        duration: true,
      },
    });

    return NextResponse.json({ success: true, track });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
