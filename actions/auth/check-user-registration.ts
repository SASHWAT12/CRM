"use server";

import { prismadb } from "@/lib/prisma";

export async function checkUserRegistration(email: string) {
  if (!email) return { error: "Email is required" };

  try {
    const user = await prismadb.users.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return { registered: !!user };
  } catch (error) {
    return { error: "Failed to check registration status" };
  }
}
