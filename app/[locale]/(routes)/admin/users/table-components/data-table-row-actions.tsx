"use client";

import { Row, Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { adminUserSchema } from "../table-data/schema";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";
import { useState } from "react";
import { toast } from "sonner";

import { Copy, Edit, MoreHorizontal, Shield, Trash, UserCheck, UserX } from "lucide-react";
import { deleteUser } from "@/actions/admin/users/delete-user";
import { activateUser } from "@/actions/admin/users/activate-user";
import { deactivateUser } from "@/actions/admin/users/deactivate-user";
import { setUserRole } from "@/actions/admin/users/set-role";
import { AppRole } from "@/lib/authz";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function DataTableRowActions<TData>({
  row,
  table,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const data = adminUserSchema.parse(row.original);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const meta = table.options.meta as { actorRole?: string; actorId?: string } | undefined;
  const actorRole = meta?.actorRole;
  const actorId = meta?.actorId;

  const isSelf = actorId === data.id;
  const isTargetRoot = data.role === "root";
  const isTargetAdmin = data.role === "admin";
  const isActorRoot = actorRole === "root";
  const isActorAdmin = actorRole === "admin";

  const canManage = isActorRoot 
    ? (!isTargetRoot || isSelf) 
    : isActorAdmin 
      ? !isTargetRoot 
      : (!isTargetRoot && !isTargetAdmin);

  const canDeactivateOrDelete = canManage && !isSelf && (!isTargetRoot || isActorRoot);
  const canActivate = canManage && (!isTargetRoot || isActorRoot);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("The URL has been copied to your clipboard.");
  };

  const onChangeRole = async (newRole: AppRole) => {
    try {
      setLoading(true);
      const result = await setUserRole(data.id, newRole);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      const result = await deleteUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deleted");
    } catch (error) {
      toast.error("Something went wrong: " + error + ". Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onActivate = async () => {
    try {
      setLoading(true);
      const result = await activateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been activated.");
    } catch (error) {
      toast.error("Something went wrong while activating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async () => {
    try {
      setLoading(true);
      const result = await deactivateUser(data.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success("User has been deactivated.");
    } catch (error) {
      toast.error("Something went wrong while deactivating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"ghost"} className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data?.id)}>
            <Copy className="mr-2 w-4 h-4" />
            Copy ID
          </DropdownMenuItem>
          {!isTargetRoot && canManage && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Shield className="mr-2 w-4 h-4" />
                  Change Role
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => onChangeRole("admin")}
                    disabled={data.role === "admin"}
                  >
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onChangeRole("doctor")}
                    disabled={data.role === "doctor"}
                  >
                    Doctor
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onChangeRole("receptionist")}
                    disabled={data.role === "receptionist"}
                  >
                    Receptionist
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
          {canActivate && data.userStatus !== "ACTIVE" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onActivate()}>
                <UserCheck className="mr-2 w-4 h-4" />
                Activate
              </DropdownMenuItem>
            </>
          )}
          {canDeactivateOrDelete && data.userStatus === "ACTIVE" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDeactivate()}>
                <UserX className="mr-2 w-4 h-4" />
                Deactivate
              </DropdownMenuItem>
            </>
          )}
          {canDeactivateOrDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Trash className="mr-2 w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
