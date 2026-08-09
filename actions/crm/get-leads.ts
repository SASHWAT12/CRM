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
    AND: [
      leadReadScopeWhere(user),
      { deletedAt: null }
    ]
  };

  // Scoped Queues based on CRM_POLICY
  const queueFilter: any = {};
  if (queue === "HOT") {
    queueFilter.lead_status = {
      name: { in: CRM_POLICY.STAGES.HOT_LEAD_STATUSES },
    };
  } else if (queue === "NEW") {
    // New Today
    queueFilter.createdAt = {
      gte: new Date(Date.now() - CRM_POLICY.THRESHOLDS.NEW_LEAD_MS),
    };
  } else if (queue === "UNTOUCHED") {
    // Awaiting First Contact: assigned but no update activity in UNTOUCHED_LEAD_MS days
    queueFilter.updatedAt = {
      lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.UNTOUCHED_LEAD_MS),
    };
  } else if (queue === "RISK") {
    // At Risk: open leads stagnant for over AT_RISK_LEAD_MS days
    queueFilter.createdAt = {
      lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.AT_RISK_LEAD_MS),
    };
  }
  where.AND.push(queueFilter);

  // Active filters
  if (assignedTo && assignedTo !== "ALL") {
    where.AND.push({ assigned_to: assignedTo });
  }

  if (leadSource && leadSource !== "ALL") {
    where.AND.push({ lead_source_id: leadSource });
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    const parts = s.split(/\s+/).filter(Boolean);

    if (parts.length > 1) {
      const firstNamePart = parts[0];
      const lastNamePart = parts.slice(1).join(" ");

      where.AND.push({
        OR: [
          { firstName: { contains: s, mode: "insensitive" } },
          { lastName: { contains: s, mode: "insensitive" } },
          {
            AND: [
              { firstName: { contains: firstNamePart, mode: "insensitive" } },
              { lastName: { contains: lastNamePart, mode: "insensitive" } },
            ],
          },
        ],
      });
    } else {
      where.AND.push({
        OR: [
          { firstName: { contains: s, mode: "insensitive" } },
          { lastName: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { phone: { contains: s, mode: "insensitive" } },
          {
            lead_source: {
              name: { contains: s, mode: "insensitive" },
            },
          },
        ],
      });
    }
  }

  const data = await prismadb.crm_Leads.findMany({
    where,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
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
