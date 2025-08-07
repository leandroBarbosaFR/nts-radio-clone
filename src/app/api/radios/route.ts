// app/api/radios/route.ts
import { supabase } from "../../../lib/supabase/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
