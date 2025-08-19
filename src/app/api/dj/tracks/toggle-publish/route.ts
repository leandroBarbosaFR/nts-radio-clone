// app/api/dj/tracks/toggle-publish/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls les admins peuvent publier/dépublier
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Droits administrateur requis" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      trackId?: string;
      is_published?: unknown;
    };
    const { trackId, is_published } = body;

    if (!trackId || typeof is_published !== "boolean") {
      return NextResponse.json(
        { error: "ID de track et statut requis" },
        { status: 400 }
      );
    }

    console.log(
      "[TOGGLE PUBLISH] Admin:",
      user.email,
      "Track:",
      trackId,
      "Status:",
      is_published
    );

    // Vérifier que la track existe
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return NextResponse.json({ error: "Track non trouvée" }, { status: 404 });
    }

    // Mettre à jour le statut de publication
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: { is_published },
      select: { id: true, title: true, is_published: true },
    });

    console.log(
      "[TOGGLE PUBLISH] Track updated:",
      updatedTrack.title,
      "Published:",
      updatedTrack.is_published
    );

    return NextResponse.json({ success: true, track: updatedTrack });
  } catch (error) {
    console.error("[TOGGLE PUBLISH] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
