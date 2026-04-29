import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET env variable is not set");
  return secret;
}

export function verifyAdmin(request) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.split(" ")[1], getSecret());
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
}
