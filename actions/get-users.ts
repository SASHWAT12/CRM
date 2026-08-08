import { prismadb } from "@/lib/prisma";

// Get all non-root users for admin module
export const getUsers = async () => {
  const data = await prismadb.users.findMany({
    where: {
      role: { not: "root" },
      email: { not: "sashwat73@gmail.com" },
    },
    orderBy: {
      created_on: "desc",
    },
    include: {
      created_by: {
        select: {
          name: true,
        },
      },
    },
  });
  return data;
};

// Get active non-root users for Selects in app etc
export const getActiveUsers = async () => {
  const data = await prismadb.users.findMany({
    where: {
      userStatus: "ACTIVE",
      role: { not: "root" },
      email: { not: "sashwat73@gmail.com" },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  });
  return data;
};

// Get new users by month for chart
export const getUsersByMonthAndYear = async (year: number) => {
  const users = await prismadb.users.findMany({
    where: {
      role: { not: "root" },
      email: { not: "sashwat73@gmail.com" },
    },
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const yearCreated = new Date(user.created_on).getFullYear();
    const month = new Date(user.created_on).toLocaleString("default", {
      month: "long",
    });

    if (yearCreated === year) {
      acc[month] = (acc[month] || 0) + 1;
    }

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((month: any) => {
    return {
      name: month,
      Number: usersByMonth[month],
    };
  });

  return chartData;
};

// Get new users by month for chart
export const getUsersByMonth = async () => {
  const users = await prismadb.users.findMany({
    where: {
      role: { not: "root" },
      email: { not: "sashwat73@gmail.com" },
    },
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const month = new Date(user.created_on).toLocaleString("default", {
      month: "long",
    });

    acc[month] = (acc[month] || 0) + 1;

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((month: any) => {
    return {
      name: month,
      Number: usersByMonth[month],
    };
  });

  return chartData;
};
