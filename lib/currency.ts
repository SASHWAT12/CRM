import { Decimal } from "@prisma/client/runtime/client";
import { prismadb } from "@/lib/prisma";

// Re-export pure functions so existing server-side imports still work
export { findRate, convertAmount, formatCurrency } from "@/lib/currency-format";
export type { Rate } from "@/lib/currency-format";

export async function getExchangeRates() {
  return [];
}

export async function getSnapshotRate(
  from: string,
  to: string
): Promise<Decimal | null> {
  if (from === to) return new Decimal("1");
  return null;
}

export async function getDefaultCurrency(): Promise<string> {
  const setting = await prismadb.crm_SystemSettings.findUnique({
    where: { key: "default_currency" },
  });
  return setting?.value || "EUR";
}

export async function getEnabledCurrencies() {
  return [];
}
