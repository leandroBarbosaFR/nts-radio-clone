// app/api/tracks/public/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      where: { is_published: true },
      orderBy: { created_at: "desc" },
      take: 5,
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

    return NextResponse.json({ slides: tracks });
  } catch (error) {
    console.error("[PUBLIC TRACKS] Error:", error);
    return NextResponse.json({ slides: [] }, { status: 500 });
  }
}
