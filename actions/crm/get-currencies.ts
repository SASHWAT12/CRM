"use server";
import { prismadb } from "@/lib/prisma";

export const getCurrencies = async () => {
  try {
    const currencies = [
      { code: "INR", name: "Indian Rupee", symbol: "₹" },
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
    ];
    return { data: currencies };
  } catch (error) {
    return { error: "Failed to fetch currencies" };
  }
};
