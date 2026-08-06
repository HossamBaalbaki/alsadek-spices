import { NextResponse } from "next/server";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";
import { uploadImage } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024;

export async function POST(request) {
  const admin = verifyAdmin(request);
  if (!admin) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "alsadek";

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: "Only JPG, PNG, or WebP images are allowed." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: "Max file size is 8 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadImage(buffer, file.type, String(folder).replace(/[^a-zA-Z0-9_-]/g, ""));

    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json({ success: false, message: "Upload failed" }, { status: 500 });
  }
}
