"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "../../accounts/[accountId]/tasks-data-table/components/data-table-column-header";
import { DataTableRowActions } from "../../accounts/[accountId]/tasks-data-table/components/data-table-row-actions";
import { priorities, statuses } from "../../accounts/[accountId]/tasks-data-table/data/data";
import moment from "moment";

export type FollowupTask = {
  id: string;
  title: string;
  content: string | null;
  priority: string;
  taskStatus: "ACTIVE" | "PENDING" | "COMPLETE" | null;
  dueDateAt: Date | null;
  assigned_user: { id: string; name: string | null } | null;
  crm_contact: { id: string; first_name: string | null; last_name: string } | null;
};

export const columns: ColumnDef<FollowupTask>[] = [
  {
    accessorKey: "dueDateAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due date" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        {row.getValue("dueDateAt") ? moment(row.getValue("dueDateAt")).format("YY-MM-DD") : "None"}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "crm_contact",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Patient" />
    ),
    cell: ({ row }) => {
      const contact = row.original.crm_contact;
      if (!contact) return <span className="text-muted-foreground text-sm">None</span>;
      return (
        <div className="w-[150px] truncate">
          <Link
            href={`/crm/patients/${contact.id}`}
            className="text-primary hover:underline font-medium text-sm"
          >
            {contact.first_name || ""} {contact.last_name}
          </Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "assigned_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),
    cell: ({ row }) => (
      <div className="w-[150px] truncate">
        {row.original.assigned_user?.name ?? "Unassigned"}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="max-w-[400px] truncate font-medium">
        {row.getValue("title")}
      </span>
    ),
  },
  {
    accessorKey: "taskStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("taskStatus")
      );

      if (!status) return null;

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = priorities.find(
        (priority) => priority.value === row.getValue("priority")
      );

      if (!priority) return null;

      return (
        <div className="flex items-center">
          {priority.icon && (
            <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{priority.label}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row as any} />,
  },
];
