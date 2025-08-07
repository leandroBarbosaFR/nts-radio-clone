// src/pages/api/radios.ts
import { supabase } from "@/lib/supabase/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const genre = req.query.genre as string;

  let query = supabase
    .from("tracks")
    .select("*")
    .order("created_at", { ascending: false });

  if (genre) {
    query = query.eq("genre", genre);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur Supabase:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}
