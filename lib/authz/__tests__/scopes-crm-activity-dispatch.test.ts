jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Leads: { findFirst: jest.fn() },
    crm_Contacts: { findFirst: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import { AuthorizationError } from "../errors";
import { assertCanReadActivityForEntity } from "../scopes/crm";

beforeEach(() => {
  jest.clearAllMocks();
});

type ModelKey = "crm_Leads" | "crm_Contacts";

const cases: Array<[string, ModelKey]> = [
  ["lead", "crm_Leads"],
  ["contact", "crm_Contacts"],
];

describe("assertCanReadActivityForEntity", () => {
  it.each(cases)(
    "dispatches %s to %s.findFirst",
    async (entityType, model) => {
      (prismadb[model].findFirst as jest.Mock).mockResolvedValue({ id: "x" });
      await assertCanReadActivityForEntity(
        { id: "u", role: "admin" },
        entityType,
        "x",
      );
      expect(prismadb[model].findFirst as jest.Mock).toHaveBeenCalled();
    },
  );

  it("dispatches case-insensitively (Lead → lead branch)", async () => {
    (prismadb.crm_Leads.findFirst as jest.Mock).mockResolvedValue({
      id: "x",
    });
    await assertCanReadActivityForEntity(
      { id: "u", role: "admin" },
      "Lead",
      "x",
    );
    expect(prismadb.crm_Leads.findFirst as jest.Mock).toHaveBeenCalled();
  });

  it("propagates AuthorizationError when underlying assert rejects", async () => {
    (prismadb.crm_Leads.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(
      assertCanReadActivityForEntity({ id: "u", role: "user" }, "lead", "x"),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
