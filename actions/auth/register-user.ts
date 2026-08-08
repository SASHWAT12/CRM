"use server";

import { prismadb } from "@/lib/prisma";

export async function checkEmailAvailability(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prismadb.users.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { available: false, error: "An account with this email already exists." };
  }

  return { available: true };
}

export async function createCrmUserRecord({
  email,
  name,
  supabase_id,
}: {
  email: string;
  name: string;
  supabase_id: string;
}) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Check once more for race conditions
    const existingUser = await prismadb.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If user exists without supabase_id, link it now
      if (!existingUser.supabase_id) {
        const updated = await prismadb.users.update({
          where: { id: existingUser.id },
          data: { supabase_id },
        });
        return { success: true, user: updated };
      }
      return { success: false, error: "CRM record already linked to this email." };
    }

    const newUser = await prismadb.users.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        supabase_id,
        role: "user",
        userStatus: "ACTIVE",
      },
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("[createCrmUserRecord Error]", error);
    return {
      success: false,
      error: error?.message || "Failed to create CRM user profile.",
    };
  }
}
