// app/api/tracks/public/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// (optional) use a singleton in /lib/prisma to avoid too many connections in dev
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const tracks = await prisma.track.findMany({
      where: { is_published: true },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        artist: true,
        audio_url: true,
        cover_image: true,
        genre: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      slides: tracks,
      pagination: { limit, offset, count: tracks.length },
    });
  } catch (error) {
    console.error("[PUBLIC TRACKS] Error:", error);
    return NextResponse.json({ slides: [] }, { status: 500 });
  }
}

