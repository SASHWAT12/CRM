import { createBrowserClientHelper } from "./supabase/client";

export const signOut = async () => {
  const supabase = createBrowserClientHelper();
  await supabase.auth.signOut();
};
