import { AuthorizationError } from "../errors";

jest.mock("@/lib/prisma", () => ({
  prismadb: {
    crm_Leads: { findFirst: jest.fn() },
    crm_Contacts: { findFirst: jest.fn() },
  },
}));

import { prismadb } from "@/lib/prisma";
import {
  leadReadScopeWhere,
  contactReadScopeWhere,
  assertCanReadLead,
} from "../scopes/crm";

const findLead = prismadb.crm_Leads.findFirst as jest.MockedFunction<
  typeof prismadb.crm_Leads.findFirst
>;

beforeEach(() => jest.clearAllMocks());

const linkedAccountOR = (uid: string) => ({
  OR: expect.arrayContaining([
    { assigned_to: uid },
    { createdBy: uid },
  ]),
});

describe("leadReadScopeWhere", () => {
  it("admin/manager → only deletedAt:null", () => {
    expect(leadReadScopeWhere({ id: "x", role: "admin" })).toEqual({
      deletedAt: null,
    });
    expect(leadReadScopeWhere({ id: "x", role: "manager" })).toEqual({
      deletedAt: null,
    });
  });
  it("user → deletedAt + OR ownership scope", () => {
    const w = leadReadScopeWhere({ id: "u1", role: "user" }) as any;
    expect(w.deletedAt).toBeNull();
    expect(w.OR).toEqual(
      expect.arrayContaining([
        { assigned_to: "u1" },
        { createdBy: "u1" },
      ]),
    );
  });
});

describe("contactReadScopeWhere", () => {
  it("admin/manager → only deletedAt:null", () => {
    expect(contactReadScopeWhere({ id: "x", role: "admin" })).toEqual({
      deletedAt: null,
    });
    expect(contactReadScopeWhere({ id: "x", role: "manager" })).toEqual({
      deletedAt: null,
    });
  });
  it("user → deletedAt + creator OR scope", () => {
    const w = contactReadScopeWhere({ id: "u1", role: "user" }) as any;
    expect(w.deletedAt).toBeNull();
    expect(w.OR).toEqual(
      expect.arrayContaining([
        { assigned_to: "u1" },
        { createdBy: "u1" },
      ]),
    );
  });
});

describe("assertCanReadLead", () => {
  it("admin: where { id, deletedAt:null }", async () => {
    findLead.mockResolvedValue({ id: "l1" } as any);
    await assertCanReadLead({ id: "x", role: "admin" }, "l1");
    expect(findLead).toHaveBeenCalledWith({
      where: { id: "l1", deletedAt: null },
      select: { id: true },
    });
  });
  it("user: where merges scope (200 hit)", async () => {
    findLead.mockResolvedValue({ id: "l1" } as any);
    await assertCanReadLead({ id: "u1", role: "user" }, "l1");
    const arg = findLead.mock.calls[0][0]!;
    expect(arg.where).toMatchObject({ id: "l1", deletedAt: null });
    expect((arg.where as any).OR).toEqual(
      expect.arrayContaining([
        { assigned_to: "u1" },
        { createdBy: "u1" },
      ]),
    );
  });
  it("throws AuthorizationError on miss (404)", async () => {
    findLead.mockResolvedValue(null);
    await expect(
      assertCanReadLead({ id: "u1", role: "user" }, "l1"),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});


