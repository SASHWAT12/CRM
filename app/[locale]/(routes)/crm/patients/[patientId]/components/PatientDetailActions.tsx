"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UpdatePatientForm } from "../../components/UpdatePatientForm";
import NewPatientFollowupForm from "./NewPatientFollowupForm";
import { LogCallForm } from "./LogCallForm";
import { Plus, Phone } from "lucide-react";

type ConfigItem = { id: string; name: string };

interface PatientDetailActionsProps {
  contact: any;
  contactTypes: ConfigItem[];
  leadSources: ConfigItem[];
}

export function PatientDetailActions({
  contact,
  contactTypes,
  leadSources,
}: PatientDetailActionsProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  return (
    <>
      <Sheet open={updateOpen} onOpenChange={setUpdateOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Update Patient - {contact?.first_name} {contact?.last_name}
            </SheetTitle>
            <SheetDescription>Update patient details</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <UpdatePatientForm
              initialData={contact}
              setOpen={setUpdateOpen}
              contactTypes={contactTypes}
              leadSources={leadSources}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={followupOpen} onOpenChange={setFollowupOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create new Followup</SheetTitle>
            <SheetDescription>
              Create a new followup for this patient with assigned user, due date, and priority
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <NewPatientFollowupForm
              contactId={contact.id}
              onFinish={() => setFollowupOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={callOpen} onOpenChange={setCallOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Log Call</SheetTitle>
            <SheetDescription>
              Log patient call detail notes and schedule followups
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <LogCallForm
              patientId={contact.id}
              onFinish={() => setCallOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 cursor-pointer"
          onClick={() => setCallOpen(true)}
        >
          <Phone className="h-4 w-4" />
          <span>Log Call</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 cursor-pointer"
          onClick={() => setFollowupOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add Followup</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              data-testid="patient-detail-actions-btn"
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
              Update
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
