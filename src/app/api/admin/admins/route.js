import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

// ─── LIST ALL ADMINS ────────────────────────────────────────────────────────
export async function GET(request) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    console.error("GET /api/admin/admins error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch admins" }, { status: 500 });
  }
}

// ─── DELETE ADMIN ───────────────────────────────────────────────────────────
export async function DELETE(request) {
  if (!verifyAdmin(request)) return unauthorized();
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/admins error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete admin" }, { status: 500 });
  }
}

// ─── CREATE NEW ADMIN ───────────────────────────────────────────────────────
export async function POST(request) {
  if (!verifyAdmin(request)) return unauthorized();

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An admin with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.adminUser.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: admin }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/admins error:", error);
    return NextResponse.json({ success: false, message: "Failed to create admin" }, { status: 500 });
  }
}
