jest.mock("@/lib/auth-server", () => ({ getSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prismadb: { users: { findUnique: jest.fn() } },
}));

jest.mock("@/actions/reports/sales", () => ({
  getOppsByMonth: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/actions/reports/leads", () => ({
  getNewLeads: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/actions/reports/activity", () => ({
  getTasksByAssignee: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/actions/reports/users", () => ({
  getUserGrowth: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/actions/reports/export-csv", () => ({
  generateCSV: jest.fn().mockReturnValue("csv,data\n"),
}));

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import * as leadsActions from "@/actions/reports/leads";
import { GET } from "../route";

const gs = getSession as jest.MockedFunction<typeof getSession>;
const fu = prismadb.users.findUnique as jest.MockedFunction<
  typeof prismadb.users.findUnique
>;

beforeEach(() => jest.clearAllMocks());

describe("GET /api/reports/export", () => {
  it("401 unauth", async () => {
    gs.mockResolvedValue(null as any);
    const res = await GET(
      new NextRequest("http://localhost/api/reports/export?category=sales&format=csv"),
    );
    expect(res.status).toBe(401);
  });

  it("400 when user requests invalid report category", async () => {
    gs.mockResolvedValue({ user: { id: "u" } } as any);
    fu.mockResolvedValue({ id: "u", role: "user" } as any);
    const res = await GET(
      new NextRequest("http://localhost/api/reports/export?category=users&format=csv"),
    );
    expect(res.status).toBe(400);
  });

  it("user can export leads-category report; scope passed to dispatcher", async () => {
    gs.mockResolvedValue({ user: { id: "u1" } } as any);
    fu.mockResolvedValue({ id: "u1", role: "user" } as any);
    const res = await GET(
      new NextRequest(
        "http://localhost/api/reports/export?category=leads&format=csv",
      ),
    );
    expect(res.status).toBe(200);
    const callArgs = (leadsActions.getNewLeads as jest.Mock).mock.calls.at(
      -1,
    )!;
    expect(callArgs[1]).toMatchObject({ lead: expect.anything() });
  });

  it("400 for unknown category", async () => {
    gs.mockResolvedValue({ user: { id: "m" } } as any);
    fu.mockResolvedValue({ id: "m", role: "manager" } as any);
    const res = await GET(
      new NextRequest("http://localhost/api/reports/export?category=bogus"),
    );
    expect(res.status).toBe(400);
  });
});
