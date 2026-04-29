import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit, getIP, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request) {
  // ─── RATE LIMIT: 10 attempts per 15 min per IP ───────────────────────────
  const ip = getIP(request);
  const rl = rateLimit(`login:${ip}`, { windowMs: 15 * 60_000, max: 10 });
  if (!rl.allowed) return tooManyRequests(rl.resetAt);

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // ─── ALWAYS RUN bcrypt to prevent timing-based user enumeration ──────────
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    const dummyHash = "$2b$10$dummyhashfortimingprotectiononly.................";
    const hashToCheck = admin?.active ? admin.password : dummyHash;
    const isValid = await bcrypt.compare(password, hashToCheck);

    if (!admin || !admin.active || !isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ─── SIGN TOKEN ──────────────────────────────────────────────────────────
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("NEXTAUTH_SECRET is not set");
      return NextResponse.json({ success: false, message: "Server configuration error" }, { status: 500 });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      secret,
      { expiresIn: "8h" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
