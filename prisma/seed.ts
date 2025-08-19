// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Créer un utilisateur admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@massiliaradio.com" },
    update: {},
    create: {
      email: "admin@massiliaradio.com".toLowerCase(),
      password_hash: adminPassword, // Utilisez password_hash avec underscore
      name: "Admin Massilia",
      role: "admin",
      is_active: true, // Utilisez is_active avec underscore
    },
  });

  console.log("✅ Admin créé:", {
    email: admin.email,
    name: admin.name,
    password: "admin123", // Mot de passe en clair pour référence
  });

  // Créer un DJ de test
  const djPassword = await bcrypt.hash("dj123", 12);
  const dj = await prisma.user.upsert({
    where: { email: "dj@massiliaradio.com" },
    update: {},
    create: {
      email: "dj@massiliaradio.com".toLowerCase(),
      password_hash: djPassword, // Utilisez password_hash avec underscore
      name: "DJ Test",
      role: "dj",
      is_active: true, // Utilisez is_active avec underscore
    },
  });

  console.log("✅ DJ créé:", {
    email: dj.email,
    name: dj.name,
    password: "dj123", // Mot de passe en clair pour référence
  });

  // TEMPORAIREMENT DÉSACTIVÉ - À réactiver après avoir corrigé le schéma

  // Créer quelques tracks de test (optionnel)
  const testTracks = [
    {
      title: "Summer Vibes",
      artist: "DJ Test",
      genre: "House",
      duration: "3:45",
      uploadedBy: dj.id,
      is_published: true,
    },
    {
      title: "Midnight Drive",
      artist: "DJ Test",
      genre: "Techno",
      duration: "4:20",
      uploadedBy: dj.id,
      is_published: false,
    },
  ];

  for (const trackData of testTracks) {
    const track = await prisma.track.create({
      data: {
        title: trackData.title,
        artist: trackData.artist,
        genre: trackData.genre,
        duration: trackData.duration,
        uploaded_by: trackData.uploadedBy, // Utilisez uploaded_by avec underscore
        is_published: trackData.is_published, // Utilisez is_published avec underscore
      },
    });
    console.log("✅ Track créée:", {
      title: track.title,
      artist: track.artist,
    });
  }

  console.log("⚠️  Création de tracks de test désactivée temporairement");
  console.log(
    '   Lancez "npx prisma db pull" puis corrigez le schéma d\'abord'
  );

  console.log("🎉 Seeding terminé !");
  console.log("");
  console.log("📋 Identifiants de connexion :");
  console.log("Admin - Email: admin@massiliaradio.com | Password: admin123");
  console.log("DJ    - Email: dj@massiliaradio.com    | Password: dj123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur lors du seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
