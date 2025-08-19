// app/api/dj/tracks/upload/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
  console.log(
    "[UPLOAD TRACK] Auth header:",
    authHeader ? "Present" : "Missing"
  );
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[UPLOAD TRACK] Invalid auth header format");
    return null;
  }

  const token = authHeader.slice(7);
  console.log("[UPLOAD TRACK] Token length:", token.length);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "your-secret-key"
    );
    if (!isAuthPayload(decoded)) {
      console.log("[UPLOAD TRACK] Token decoded but missing required fields");
      return null;
    }
    console.log(
      "[UPLOAD TRACK] Token decoded successfully for:",
      decoded.email
    );
    return decoded;
  } catch (e: unknown) {
    console.log(
      "[UPLOAD TRACK] Token verification failed:",
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

/* ---------- helpers ---------- */
const sanitizeName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 140);

function getStr(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  return typeof v === "string" ? v : undefined;
}

function getFile(fd: FormData, key: string): File | undefined {
  const v = fd.get(key);
  // FormDataEntryValue is string | File
  if (v instanceof File) return v;
  // For environments where instanceof might be tricky, fallback feature check:
  if (typeof v === "object" && v !== null && "arrayBuffer" in v) {
    return v as File;
  }
  return undefined;
}

const normalize = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);

export async function POST(req: NextRequest) {
  try {
    console.log("[UPLOAD TRACK] === API CALL START ===");

    const user = verifyToken(req);
    if (!user) {
      console.log("[UPLOAD TRACK] Authorization failed");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("[UPLOAD TRACK] User:", user.email);

    const formData = await req.formData();

    const title = getStr(formData, "title");
    const artist = getStr(formData, "artist");
    const genre = getStr(formData, "genre");
    const duration = getStr(formData, "duration");
    const soundcloudUrl = getStr(formData, "soundcloudUrl");

    const audioFile = getFile(formData, "audioFile");
    const coverFile = getFile(formData, "coverFile");

    if (!title || !artist) {
      return NextResponse.json(
        { error: "Titre et artiste requis" },
        { status: 400 }
      );
    }

    console.log("[UPLOAD TRACK] Track info:", { title, artist, genre });

    let audioUrl: string | null = null;
    let coverImageUrl: string | null = null;

    // Ensure folders exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const audioDir = path.join(uploadsDir, "audio");
    const imagesDir = path.join(uploadsDir, "images");

    try {
      await mkdir(uploadsDir, { recursive: true });
      await mkdir(audioDir, { recursive: true });
      await mkdir(imagesDir, { recursive: true });
    } catch {
      /* already exists */
    }

    // Audio upload
    if (audioFile && audioFile.size > 0) {
      console.log(
        "[UPLOAD TRACK] Processing audio file:",
        audioFile.name ?? "(no-name)"
      );
      const audioBytes = await audioFile.arrayBuffer();
      const audioBuffer = Buffer.from(audioBytes);

      const safeName = sanitizeName(audioFile.name ?? "audio");
      const audioFileName = `${Date.now()}-${safeName}`;
      const audioPath = path.join(audioDir, audioFileName);

      await writeFile(audioPath, audioBuffer);
      audioUrl = `/uploads/audio/${audioFileName}`;
      console.log("[UPLOAD TRACK] Audio saved:", audioUrl);
    }

    // Cover upload
    if (coverFile && coverFile.size > 0) {
      console.log(
        "[UPLOAD TRACK] Processing cover image:",
        coverFile.name ?? "(no-name)"
      );
      const imageBytes = await coverFile.arrayBuffer();
      const imageBuffer = Buffer.from(imageBytes);

      const safeName = sanitizeName(coverFile.name ?? "cover");
      const imageFileName = `${Date.now()}-${safeName}`;
      const imagePath = path.join(imagesDir, imageFileName);

      await writeFile(imagePath, imageBuffer);
      coverImageUrl = `/uploads/images/${imageFileName}`;
      console.log("[UPLOAD TRACK] Cover saved:", coverImageUrl);
    }

    // DB create
    const track = await prisma.track.create({
      data: {
        title: title.trim(),
        artist: artist.trim(),
        genre: normalize(genre),
        duration: normalize(duration),
        audio_url: audioUrl,
        cover_image: coverImageUrl,
        soundcloudUrl: normalize(soundcloudUrl),
        uploaded_by: user.userId,
        is_published: false, // validation admin par défaut
        file_size: audioFile ? BigInt(audioFile.size) : null,
      },
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        duration: true,
      },
    });

    console.log("[UPLOAD TRACK] Track created:", track.id);
    console.log("[UPLOAD TRACK] === API CALL SUCCESS ===");

    return NextResponse.json({ success: true, track });
  } catch (e: unknown) {
    console.error(
      "[UPLOAD TRACK] Error:",
      e instanceof Error ? e.stack || e.message : String(e)
    );
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
