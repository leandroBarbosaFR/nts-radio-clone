// app/api/dj/login/route.ts
export const runtime = "nodejs"; // évite Edge (bcryptjs)

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const cleanEmail = (email ?? "").trim();
    const cleanPassword = (password ?? "").trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // ⚠️ findUnique est sensible à la casse : on passe en findFirst + mode: 'insensitive'
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
      // on sélectionne uniquement ce qu'il faut
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        password_hash: true,
      },
    });

    if (!user) {
      // Log côté serveur pour debug (sera visible dans le terminal)
      console.log("[LOGIN] User not found:", cleanEmail);
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 401 });
    }

    const ok = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!ok) {
      console.log("[LOGIN] Bad password for:", user.email);
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn("[LOGIN] Missing JWT_SECRET in env");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret || "dev-only-secret",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[LOGIN] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
