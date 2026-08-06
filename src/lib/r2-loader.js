const UNSIZED_EXTS = /\.(heic|heif|gif|svg|webp)$/i;

export default function r2Loader({ src, width }) {
  if (src.includes("r2.dev") || src.includes("r2.cloudflarestorage.com")) {
    if (UNSIZED_EXTS.test(src)) return src;
    const base = src.replace(/\.[^.]+$/, "");
    const size = width <= 480 ? 400 : width <= 900 ? 800 : 1200;
    return `${base}_${size}.webp`;
  }
  if (src.includes("res.cloudinary.com")) {
    return src.replace("/upload/", `/upload/f_auto,q_80,w_${width}/`);
  }
  return src;
}
