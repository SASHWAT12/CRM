"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../../../accounts/[accountId]/tasks-data-table/components/columns";
import { TasksDataTable } from "../../../accounts/[accountId]/tasks-data-table/components/data-table";

import NewPatientTaskForm from "./NewPatientTaskForm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface PatientTasksViewProps {
  data: any;
  contactId: string;
}

const PatientTasksView = ({ data, contactId }: PatientTasksViewProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div>
            <CardTitle className="cursor-pointer">
              Patient Followups
            </CardTitle>
            <CardDescription></CardDescription>
          </div>
          <div className="flex space-x-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  data-testid="add-task-btn"
                  className="m-2 cursor-pointer"
                >
                  +
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create new Followup</SheetTitle>
                  <SheetDescription>
                    Create a new followup for this patient with assigned user, due
                    date, and priority
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <NewPatientTaskForm
                    contactId={contactId}
                    onFinish={() => setOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          "No assigned followups found"
        ) : (
          <TasksDataTable data={data} columns={columns} />
        )}
      </CardContent>
    </Card>
  );
};

export default PatientTasksView;
