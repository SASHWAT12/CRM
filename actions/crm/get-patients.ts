import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  contactReadScopeWhere,
  AuthenticationError,
} from "@/lib/authz";
import { CRM_POLICY } from "@/lib/policies/crm-policy";

export const getPatients = cache(async (params: {
  queue?: string;
  search?: string;
  assignedTo?: string;
  pipelineStage?: string;
} = {}) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  const { queue, search, assignedTo, pipelineStage } = params;
  const where: any = {
    AND: [
      contactReadScopeWhere(user),
      { deletedAt: null }
    ]
  };

  const activeStages = CRM_POLICY.STAGES.ACTIVE_PATIENT_PIPELINE;

  // Scoped Queues based on CRM_POLICY
  const queueFilter: any = {};
  if (queue === "MISSED") {
    queueFilter.pipelineStage = { in: activeStages };
    queueFilter.appointments = {
      some: {
        status: { in: ["NO_SHOW", "CANCELLED"] },
      },
    };
  } else if (queue === "ATTENTION") {
    // Needs Follow-up: active stages with overdue followups OR no active tasks scheduled
    queueFilter.pipelineStage = { in: activeStages };
    queueFilter.OR = [
      {
        tasks: {
          some: {
            taskStatus: "ACTIVE",
            dueDateAt: { lt: new Date() },
          },
        },
      },
      {
        tasks: {
          none: {
            taskStatus: "ACTIVE",
          },
        },
      },
    ];
  } else if (queue === "STALE") {
    // No Recent Activity: active stages, no scheduled tasks, no updates in STALE_PATIENT_MS days
    queueFilter.pipelineStage = { in: activeStages };
    queueFilter.tasks = {
      none: {
        taskStatus: "ACTIVE",
      },
    };
    queueFilter.updatedAt = {
      lt: new Date(Date.now() - CRM_POLICY.THRESHOLDS.STALE_PATIENT_MS),
    };
  } else if (queue === "CONVERTED") {
    // Recently Converted: stage is treatment started, created or updated within RECENT_CONVERSION_MS
    queueFilter.pipelineStage = CRM_POLICY.STAGES.CONVERTED_STAGE;
    queueFilter.updatedAt = {
      gte: new Date(Date.now() - CRM_POLICY.THRESHOLDS.RECENT_CONVERSION_MS),
    };
  } else if (queue === "INACTIVE") {
    queueFilter.pipelineStage = CRM_POLICY.STAGES.CLOSED_LOST_STAGE;
  }
  where.AND.push(queueFilter);

  // Active filters
  if (assignedTo && assignedTo !== "ALL") {
    where.AND.push({ assigned_to: assignedTo });
  }

  if (pipelineStage && pipelineStage !== "ALL") {
    where.AND.push({ pipelineStage });
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    where.AND.push({
      OR: [
        { first_name: { contains: s, mode: "insensitive" } },
        { last_name: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
        { mobile_phone: { contains: s, mode: "insensitive" } },
      ]
    });
  }

  const data = await prismadb.crm_Contacts.findMany({
    where,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      crate_by_user: {
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
    },
    orderBy: {
      created_on: "desc",
    },
  });
  return data;
});
