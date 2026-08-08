import { prismadb } from "@/lib/prisma";
import { createServerClientHelper } from "./supabase/server";

export async function getSession() {
  // State A: Development bypass enabled
  // Rules: Only works in development (NODE_ENV === "development" && DEV_AUTH_BYPASS === "true")
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  ) {
    const bypassEmail = process.env.DEV_AUTH_EMAIL || "test@nextcrm.app";
    try {
      const user = await prismadb.users.findUnique({
        where: { email: bypassEmail },
      });

      if (!user) {
        console.warn(`[Auth Bypass] Dev user not found: ${bypassEmail}`);
        return null;
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar || user.image || null,
          role: user.role,
          userStatus: user.userStatus,
          userLanguage: user.userLanguage,
        },
      } as any;
    } catch (err) {
      console.warn("[Auth Bypass Error]", err);
      return null;
    }
  }

  // Environment Validation: Ensure Supabase credentials are configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Controlled developer warning; avoids crashing protected layouts
    console.warn(
      "[Supabase Auth] Missing required environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return null;
  }

  // State B: Supabase configured -> Validate session -> Lookup CRM user
  try {
    const supabase = await createServerClientHelper();
    if (!supabase) {
      return null;
    }

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return null;
    }

    // Lookup CRM User using Supabase User ID mapping
    let user = await prismadb.users.findFirst({
      where: { supabase_id: supabaseUser.id },
    });

    // Fallback: Map/bind by email on first login
    if (!user && supabaseUser.email) {
      user = await prismadb.users.findUnique({
        where: { email: supabaseUser.email.toLowerCase() },
      });

      if (user) {
        user = await prismadb.users.update({
          where: { id: user.id },
          data: { supabase_id: supabaseUser.id },
        });
      }
    }

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar || user.image || null,
        role: user.role,
        userStatus: user.userStatus,
        userLanguage: user.userLanguage,
      },
    } as any;
  } catch (error) {
    console.warn("[Auth Server Error]", error);
    // State C: Return null on error or unauthenticated state
    return null;
  }
}