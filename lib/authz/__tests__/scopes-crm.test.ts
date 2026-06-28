jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Contacts: { updateMany: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import { tryScopedUpdateContact } from "../scopes/crm";

const updateManyContact = prismadb.crm_Contacts.updateMany as jest.MockedFunction<
  typeof prismadb.crm_Contacts.updateMany
>;

beforeEach(() => jest.clearAllMocks());

describe("tryScopedUpdateContact", () => {
  it("admin: bare where on contact id, returns true on count > 0", async () => {
    updateManyContact.mockResolvedValue({ count: 1 } as any);
    const ok = await tryScopedUpdateContact(
      { id: "u1", role: "admin" },
      "c1",
      { website: "x" },
    );
    expect(ok).toBe(true);
    expect(updateManyContact).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { website: "x", updatedBy: "u1" },
    });
  });

  it("manager: bare where on contact id", async () => {
    updateManyContact.mockResolvedValue({ count: 1 } as any);
    await tryScopedUpdateContact({ id: "u2", role: "manager" }, "c1", { website: "x" });
    expect(updateManyContact).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { website: "x", updatedBy: "u2" },
    });
  });

  it("user: scoped where with ownership OR clauses", async () => {
    updateManyContact.mockResolvedValue({ count: 1 } as any);
    await tryScopedUpdateContact({ id: "u3", role: "user" }, "c1", { website: "x" });
    const arg = updateManyContact.mock.calls[0][0]!;
    expect(arg.where).toMatchObject({
      id: "c1",
      OR: expect.arrayContaining([
        { assigned_to: "u3" },
        { createdBy: "u3" },
      ]),
    });
  });

  it("returns false when count is 0", async () => {
    updateManyContact.mockResolvedValue({ count: 0 } as any);
    const ok = await tryScopedUpdateContact(
      { id: "u3", role: "user" },
      "c1",
      { website: "x" },
    );
    expect(ok).toBe(false);
  });
});
