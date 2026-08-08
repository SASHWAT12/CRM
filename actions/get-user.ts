import { prismadb } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";

export const getUser = async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }
  const data = await prismadb.users.findUnique({
    where: {
      id: session.user.id,
    },
  });
  return data;
};
