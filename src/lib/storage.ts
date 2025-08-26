// lib/storage.ts
export async function uploadFileToSupabase(
  file: File,
  bucket: string,
  folder = "uploads"
) {
  const r = await fetch("/api/uploads/signed-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      bucket,
      folder,
      filename: file.name,
      contentType: file.type,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Failed to create signed URL");

  const put = await fetch(j.signedUrl, {
    method: "PUT",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed");

  // j.publicUrl works if bucket is public. If private, return j.path instead.
  return { publicUrl: j.publicUrl as string, path: j.path as string };
}
