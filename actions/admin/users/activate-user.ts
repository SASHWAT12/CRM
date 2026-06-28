"use server";
import { prismadb } from "@/lib/prisma";
import sendEmail from "@/lib/sendmail";
import { revalidatePath } from "next/cache";
import {
  requireRole,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const activateUser = async (userId: string) => {
  let actor;
  try {
    actor = await requireRole(["root", "admin"]);
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  if (!userId) return { error: "userId is required" };

  const targetUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, userLanguage: true },
  });

  if (!targetUser) {
    return { error: "User not found." };
  }

  if (targetUser.role === "root" && actor.role !== "root") {
    return { error: "Only Root accounts can manage other Root accounts." };
  }

  try {
    const user = await prismadb.users.update({
      where: { id: userId },
      data: { userStatus: "ACTIVE" },
    });

    let message;
    switch (user.userLanguage) {
      case "en":
        message = `You account has been activated in ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${user.email} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
      case "cz":
        message = `Váš účet v aplikaci ${process.env.NEXT_PUBLIC_APP_NAME} byl aktivován. \n\n Vaše uživatelské jméno je: ${user.email} \n\n  Prosím přihlašte se na ${process.env.NEXT_PUBLIC_APP_URL} \n\n Děkujeme \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
      default:
        message = `You account has been activated in ${process.env.NEXT_PUBLIC_APP_NAME} \n\n Your username is: ${user.email} \n\n Please login to ${process.env.NEXT_PUBLIC_APP_URL} \n\n Thank you \n\n ${process.env.NEXT_PUBLIC_APP_NAME}`;
        break;
    }

    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Invitation to ${process.env.NEXT_PUBLIC_APP_NAME}`,
      text: message,
    });

    revalidatePath("/[locale]/(routes)/admin", "page");
    return { data: user };
  } catch (error) {
    console.log("[ACTIVATE_USER]", error);
    return { error: "Failed to activate user" };
  }
};
