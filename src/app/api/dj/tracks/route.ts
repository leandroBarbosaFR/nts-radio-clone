// app/api/dj/tracks/route.ts
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
    return isAuthPayload(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

// Infer the type of the `where` param for findMany
type TrackWhere = NonNullable<
  Parameters<typeof prisma.track.findMany>[0]
>["where"];

export async function GET(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("[GET TRACKS] User:", user.email, "Role:", user.role);

    const whereClause: TrackWhere =
      user.role === "admin" ? {} : { uploaded_by: user.userId };

    const tracks = await prisma.track.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        uploader: { select: { name: true, email: true } },
      },
    });

    // `track` is fully typed here based on the actual query result
    const formattedTracks = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      genre: track.genre ?? undefined,
      duration: track.duration ?? undefined,
      audio_url: track.audio_url ?? undefined,
      cover_image: track.cover_image ?? undefined,
      soundcloudUrl: track.soundcloudUrl ?? undefined,
      is_published: Boolean(track.is_published),
      created_at: track.created_at
        ? track.created_at.toISOString()
        : new Date().toISOString(),
      uploadedBy: track.uploader?.name ?? "Unknown",
    }));

    return NextResponse.json({ success: true, tracks: formattedTracks });
  } catch (error) {
    console.error("[GET TRACKS] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
