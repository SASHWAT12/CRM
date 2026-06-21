// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// // TODO: Add requireRole() helper for viewer restriction enforcement
// // when viewer role is first assigned to users

// export async function getSession() {
//   return auth.api.getSession({
//     headers: await headers(),
//   });
// }

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prismadb } from "@/lib/prisma";

export async function getSession() {
  if (process.env.AUTH_MODE === "dev-bypass") {
    const user = await prismadb.users.findUnique({
      where: {
        email: process.env.TEST_USER_EMAIL,
      },
    });

    if (!user) {
      throw new Error(
        `Dev bypass user not found: ${process.env.TEST_USER_EMAIL}`
      );
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        userStatus: user.userStatus,
        userLanguage: user.userLanguage,
      },
    } as any;
  }

  return auth.api.getSession({
    headers: await headers(),
  });
}