"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NewPatientTaskForm from "../../contacts/[contactId]/components/NewPatientTaskForm";

export function CreateFollowupButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-1 cursor-pointer">
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
          <NewPatientTaskForm onFinish={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
