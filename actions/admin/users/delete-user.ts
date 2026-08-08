"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireRole,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const deleteUser = async (userId: string) => {
  let actor;
  try {
    actor = await requireRole(["root", "admin"]);
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  if (!userId) return { error: "userId is required" };

  if (actor.id === userId) {
    return { error: "Self-destruction is not permitted." };
  }

  const targetUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) {
    return { error: "User not found." };
  }

  if (targetUser.role === "root") {
    return { error: "ROOT user is immutable and cannot be deleted." };
  }

  try {
    const user = await prismadb.users.delete({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        account_name: true,
        avatar: true,
        role: true,
        userStatus: true,
        lastLoginAt: true,
      },
    });
    revalidatePath("/[locale]/(routes)/admin", "page");
    return { data: user };
  } catch (error) {
    console.log("[DELETE_USER]", error);
    return { error: "Failed to delete user" };
  }
};
