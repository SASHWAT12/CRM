"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AlertModal from "@/components/modals/alert-modal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { taskSchema } from "../data/schema";
import { deleteTask } from "@/actions/crm/tasks/delete-task";
import { updateTask } from "@/actions/crm/tasks/update-task";
import UpdateTaskForm from "../../components/UpdateTaskForm";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const task = taskSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteTask(task.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Followup deleted successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, during deleting followup");
    } finally {
      setOpen(false);
      setIsLoading(false);
      router.refresh();
    }
  };

  const onComplete = async () => {
    setIsLoading(true);
    try {
      const result = await updateTask({ id: task.id, taskStatus: "COMPLETE" });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Followup marked as completed");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong, during completing followup");
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={isLoading}
      />

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Followup</SheetTitle>
            <SheetDescription>Update followup details</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <UpdateTaskForm
              initialData={row.original}
              onFinish={() => setEditOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => router.push(`/crm/tasks/viewtask/${task?.id}`)}
          >
            View
          </DropdownMenuItem>
          {task.taskStatus !== "COMPLETE" && (
            <DropdownMenuItem onClick={onComplete}>
              Complete
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
