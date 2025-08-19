// app/api/dj/tracks/delete/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { unlink } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

type Role = "admin" | "dj";
interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

function isAuthPayload(value: unknown): value is AuthPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.userId === "string" &&
    typeof v.email === "string" &&
    (v.role === "admin" || v.role === "dj")
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
    if (!isAuthPayload(decoded)) return null; // ensure it has our fields
    return decoded;
  } catch {
    return null;
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = (await req.json()) as { trackId?: string };
    const trackId = body.trackId;
    if (!trackId) {
      return NextResponse.json(
        { error: "ID de track requis" },
        { status: 400 }
      );
    }

    console.log("[DELETE TRACK] User:", user.email, "Track:", trackId);

    // Admin can delete any track; DJ only their own
    const whereClause =
      user.role === "admin"
        ? { id: trackId }
        : { id: trackId, uploaded_by: user.userId };

    const track = await prisma.track.findFirst({ where: whereClause });
    if (!track) {
      return NextResponse.json(
        { error: "Track non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Delete local files only (skip remote URLs)
    const isLocalPath = (p?: string | null) => !!p && !/^https?:\/\//i.test(p);

    try {
      if (isLocalPath(track.audio_url)) {
        const audioPath = path.join(process.cwd(), "public", track.audio_url!);
        await unlink(audioPath);
        console.log("[DELETE TRACK] Audio file deleted:", track.audio_url);
      }
      if (isLocalPath(track.cover_image)) {
        const imagePath = path.join(
          process.cwd(),
          "public",
          track.cover_image!
        );
        await unlink(imagePath);
        console.log("[DELETE TRACK] Cover image deleted:", track.cover_image);
      }
    } catch (fileError) {
      console.error("[DELETE TRACK] Error deleting files:", fileError);
      // continue even if file removal fails
    }

    await prisma.track.delete({ where: { id: trackId } });
    console.log("[DELETE TRACK] Track deleted from database:", trackId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE TRACK] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
