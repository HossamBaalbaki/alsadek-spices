import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAdmin, unauthorized } from "@/lib/adminAuth";

// ─── CHANGE OWN PASSWORD ────────────────────────────────────────────────────
export async function PUT(request) {
  const decoded = verifyAdmin(request);
  if (!decoded) return unauthorized();

  try {
    const body = await request.json();
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: decoded.id } });
    if (!admin || !admin.active) return unauthorized();

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: decoded.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("PUT /api/admin/admins/password error:", error);
    return NextResponse.json({ success: false, message: "Failed to update password" }, { status: 500 });
  }
}
