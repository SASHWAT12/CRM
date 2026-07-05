import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  leadReadScopeWhere,
  AuthenticationError,
} from "@/lib/authz";
import { CRM_POLICY } from "@/lib/policies/crm-policy";

export const getLeads = cache(async (params: {
  queue?: string;
  search?: string;
  assignedTo?: string;
  leadSource?: string;
} = {}) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  const { queue, search, assignedTo, leadSource } = params;
  const where: any = {
    ...leadReadScopeWhere(user),
    deletedAt: null,
  };

  // Scoped Queues based on CRM_POLICY
  if (queue === "HOT") {
    where.lead_status = {
      name: { in: CRM_POLICY.STAGES.HOT_LEAD_STATUSES },
    };
  } else if (queue === "NEW") {
    // New Today
    where.createdAt = {
      gte: new Date(Date.now() - CRM_POLICY.THRESHOLDS.NEW_LEAD_MS),
    };
  } else if (queue === "UNTOUCHED") {
    // Awaiting First Contact: assigned but no update activity in UNTOUCHED_LEAD_MS days
    where.updatedAt = {
      lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.UNTOUCHED_LEAD_MS),
    };
  } else if (queue === "RISK") {
    // At Risk: open leads stagnant for over AT_RISK_LEAD_MS days
    where.createdAt = {
      lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.AT_RISK_LEAD_MS),
    };
  }

  // Active filters
  if (assignedTo && assignedTo !== "ALL") {
    where.assigned_to = assignedTo;
  }

  if (leadSource && leadSource !== "ALL") {
    where.lead_source_id = leadSource;
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    where.OR = [
      ...(where.OR || []),
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
    ];
  }

  const data = await prismadb.crm_Leads.findMany({
    where,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      assigned_accounts: true,
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
            },
          },
        },
      },
      lead_status: true,
      lead_source: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
});
