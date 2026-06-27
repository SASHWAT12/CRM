"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NewPatientTaskForm from "../../contacts/[contactId]/components/NewPatientTaskForm";
import { Plus, X } from "lucide-react";

export function FollowupFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const status = searchParams?.get("status") || "ALL";
  const contactId = searchParams?.get("contactId") || "";

  const updateFilters = (newStatus: string, newContactId: string) => {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
    if (newContactId) params.set("contactId", newContactId);
    router.push(`/crm/tasks?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 bg-muted/30 p-4 rounded-lg border">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
        <div className="flex flex-col gap-1 w-full sm:w-[200px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by Patient</span>
          <div className="flex gap-1 items-center">
            <PatientSearchCombobox
              value={contactId}
              onChange={(id) => updateFilters(status, id)}
            />
            {contactId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateFilters(status, "")}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[150px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by Status</span>
          <Select
            value={status}
            onValueChange={(val) => updateFilters(val, contactId)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETE">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetTrigger asChild>
          <Button className="gap-1 cursor-pointer w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Create Followup</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create new Followup</SheetTitle>
            <SheetDescription>
              Create a new followup for any patient with assigned user, due date, and priority
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <NewPatientTaskForm
              onFinish={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
