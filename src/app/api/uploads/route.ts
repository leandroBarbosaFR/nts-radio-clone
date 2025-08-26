// app/api/uploads/signed-url/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { bucket, folder = "", filename, contentType } = await req.json();

    if (!bucket || !filename) {
      return NextResponse.json(
        { error: "bucket and filename are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // SERVICE role key – server only
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 140);
    const path = `${folder ? `${folder}/` : ""}${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      publicUrl,
      contentType: contentType ?? null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
