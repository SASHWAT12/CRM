"use client";

import React, { useTransition } from "react";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Trash, CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteFollowup } from "@/actions/crm/followups/delete-followup";
import { updateFollowup } from "@/actions/crm/followups/update-followup";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const task = row.original as { id: string; title: string; taskStatus: string };

  const onComplete = () => {
    startTransition(async () => {
      try {
        const res = await updateFollowup({
          id: task.id,
          taskStatus: "COMPLETE",
        });
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Followup marked as completed");
          router.refresh();
        }
      } catch (err: any) {
        toast.error("Failed to complete followup");
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      try {
        const res = await deleteFollowup(task.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Followup deleted successfully");
          router.refresh();
        }
      } catch (err: any) {
        toast.error("Failed to delete followup");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => router.push(`/crm/followups/viewfollowup/${task.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View details
        </DropdownMenuItem>
        {task.taskStatus !== "COMPLETE" && (
          <DropdownMenuItem onClick={onComplete} disabled={isPending}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Mark complete
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
