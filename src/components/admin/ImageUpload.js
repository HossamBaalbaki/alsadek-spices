"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dltz3gpiy";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "AlSadeq";

export default function ImageUpload({ images = [], onChange, max = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validImages = images.filter((u) => typeof u === "string" && u.trim());

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Max file size is 8 MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "alsadek");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");

      onChange([...validImages, data.secure_url]);
    } catch (err) {
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const remove = (index) => {
    onChange(validImages.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preview grid */}
      {validImages.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {validImages.map((url, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-stone-200 group">
              <Image
                src={url}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold leading-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload trigger */}
      {validImages.length < max && (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-stone-300 text-stone-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Image
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {error && (
        <p className="text-red-600 text-xs font-semibold">{error}</p>
      )}

      <p className="text-xs text-stone-400">
        {validImages.length}/{max} images · JPG, PNG, WebP · max 8 MB each
      </p>
    </div>
  );
}
