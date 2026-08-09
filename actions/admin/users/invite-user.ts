"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AppRole } from "@prisma/client";
import {
  requireRole,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const inviteUser = async (data: {
  name: string;
  email: string;
  role: string;
}) => {
  let actor;
  try {
    actor = await requireRole(["root", "admin"]);
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  const { name, email, role } = data;

  if (!name || !email || !role) {
    return { error: "Name, Email, and Role are required!" };
  }

  // Enforce creation hierarchy permissions:
  // - Root can create: admin, doctor, receptionist, counsellor
  // - Admin can create: doctor, receptionist, counsellor (cannot create root or admin)
  if (role === "root") {
    return { error: "Root accounts cannot be created." };
  }
  if (!["admin", "doctor", "receptionist"].includes(role)) {
    return { error: "Invalid role selected." };
  }

  const checkexisting = await prismadb.users.findFirst({
    where: { email },
  });

  if (checkexisting) {
    return { error: "User already exists!" };
  }

  try {
    const user = await prismadb.users.create({
      data: {
        name,
        email,
        userStatus: "ACTIVE",
        role: role as AppRole,
        created_by_id: actor.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        userStatus: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return { error: "User not created" };
    }

    revalidatePath("/[locale]/(routes)/admin", "page");
    return { data: user };
  } catch (error) {
    console.log("[CREATE_USER]", error);
    return { error: "Failed to create user" };
  }
};
