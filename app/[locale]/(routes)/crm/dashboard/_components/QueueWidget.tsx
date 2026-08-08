"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, Calendar, AlertCircle } from "lucide-react";
import moment from "moment";

import { updateFollowup } from "@/actions/crm/followups/update-followup";
import { updatePatient } from "@/actions/crm/patients/update-patient";
import { updateAppointment } from "@/actions/crm/appointments/update-appointment";
import { createFollowup } from "@/actions/crm/followups/create-followup";

type StaffItem = { id: string; name: string; role: string };

interface QueueWidgetProps {
  type: "overdue" | "unassigned" | "no-doctor" | "stale" | "lost-no-reason";
  items: any[];
  staffList?: StaffItem[];
  doctorList?: any[];
  currentUserId?: string;
  onActionComplete?: () => void;
}

export function QueueWidget({
  type,
  items = [],
  staffList = [],
  doctorList = [],
  currentUserId = "",
  onActionComplete,
}: QueueWidgetProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [customDate, setCustomDate] = useState("");

  const handleCompleteTask = async (taskId: string) => {
    setLoadingId(taskId);
    try {
      const res = await updateFollowup({ id: taskId, taskStatus: "COMPLETE" });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Followup marked as complete");
        router.refresh();
        if (onActionComplete) onActionComplete();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRescheduleTask = async (taskId: string) => {
    if (!customDate) {
      toast.error("Please select a date");
      return;
    }
    setLoadingId(taskId);
    try {
      const res = await updateFollowup({ id: taskId, dueDateAt: new Date(customDate) });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Followup rescheduled");
        setEditingId(null);
        setCustomDate("");
        router.refresh();
        if (onActionComplete) onActionComplete();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAssignCounselor = async (patientId: string, staffId: string) => {
    setLoadingId(patientId);
    try {
      const res = await updatePatient({ id: patientId, assigned_to: staffId });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Counselor assigned successfully");
        router.refresh();
        if (onActionComplete) onActionComplete();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAssignDoctor = async (appt: any, docId: string) => {
    setLoadingId(appt.id);
    try {
      const res = await updateAppointment({ id: appt.id, v: appt.v, doctorId: docId });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Doctor assigned successfully");
        router.refresh();
        if (onActionComplete) onActionComplete();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateFollowup = async (patientId: string) => {
    if (!customDate) {
      toast.error("Please select a callback date");
      return;
    }
    setLoadingId(patientId);
    try {
      const res = await createFollowup({
        title: "Followup callback",
        content: "Scheduled from Stale Patients Queue on Dashboard",
        priority: "medium",
        user: currentUserId,
        contact: patientId,
        dueDateAt: new Date(customDate),
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Callback followup scheduled successfully");
        setEditingId(null);
        setCustomDate("");
        router.refresh();
        if (onActionComplete) onActionComplete();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveLossReason = async (patientId: string) => {
    if (!customValue.trim()) {
      toast.error("Please enter a loss reason");
      return;
    }
    setLoadingId(patientId);
    try {
      const res = await updatePatient({ id: patientId, lossReason: customValue });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Loss reason updated successfully");
        setEditingId(null);
        setCustomValue("");
        router.refresh();
        if (onActionComplete) onActionComplete();
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground bg-muted/10 rounded-md border border-dashed">
        <AlertCircle className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
        <span>No items currently in this queue. All caught up!</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden bg-background">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            {type === "overdue" && (
              <>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Task</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Patient</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Due Date</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase text-right">Actions</TableHead>
              </>
            )}
            {type === "unassigned" && (
              <>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Patient</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Created On</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Source</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase text-right">Assign staff</TableHead>
              </>
            )}
            {type === "no-doctor" && (
              <>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Patient</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Scheduled Time</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Current Assignee</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase text-right">Assign Doctor</TableHead>
              </>
            )}
            {type === "stale" && (
              <>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Patient</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Pipeline Stage</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Owner</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase text-right">Actions</TableHead>
              </>
            )}
            {type === "lost-no-reason" && (
              <>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Patient</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Closed On</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase">Owner</TableHead>
                <TableHead className="h-9 text-[11px] font-bold uppercase text-right">Actions</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/5">
              {type === "overdue" && (
                <>
                  <TableCell className="py-2 text-xs font-semibold max-w-[200px] truncate">
                    {item.title}
                  </TableCell>
                  <TableCell className="py-2 text-xs font-medium text-primary">
                    {item.crm_contact
                      ? `${item.crm_contact.first_name || ""} ${item.crm_contact.last_name || ""}`
                      : "No Patient"}
                  </TableCell>
                  <TableCell className="py-2 text-xs font-bold text-rose-600">
                    {moment(item.dueDateAt).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <div className="flex gap-1.5 justify-end">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="date"
                            className="h-7 text-xs w-32 py-1"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="h-7 text-[10px] px-2"
                            disabled={loadingId === item.id}
                            onClick={() => handleRescheduleTask(item.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] px-2 text-muted-foreground"
                            onClick={() => {
                              setEditingId(null);
                              setCustomDate("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
                            disabled={loadingId === item.id}
                            onClick={() => handleCompleteTask(item.id)}
                          >
                            <Check className="h-3 w-3" />
                            <span>Complete</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingId(item.id);
                              setCustomDate(moment(item.dueDateAt).format("YYYY-MM-DD"));
                            }}
                          >
                            <Calendar className="h-3 w-3" />
                            <span>Reschedule</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </>
              )}

              {type === "unassigned" && (
                <>
                  <TableCell className="py-2 text-xs font-semibold text-primary">
                    {item.first_name || ""} {item.last_name || ""}
                  </TableCell>
                  <TableCell className="py-2 text-xs font-medium">
                    {moment(item.created_on).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">
                    {item.lead_source?.name || "Direct / Unknown"}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <Select
                      disabled={loadingId === item.id}
                      onValueChange={(val) => handleAssignCounselor(item.id, val)}
                    >
                      <SelectTrigger className="h-7 text-xs w-44 ml-auto">
                        <SelectValue placeholder="Select staff..." />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} ({staff.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </>
              )}

              {type === "no-doctor" && (
                <>
                  <TableCell className="py-2 text-xs font-semibold text-primary">
                    {item.patient
                      ? `${item.patient.first_name || ""} ${item.patient.last_name || ""}`
                      : "Unknown"}
                  </TableCell>
                  <TableCell className="py-2 text-xs font-medium">
                    {moment(item.scheduledAt).format("MMM DD, YYYY - hh:mm A")}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">
                    {item.doctor?.name || "None"}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <Select
                      disabled={loadingId === item.id}
                      onValueChange={(val) => handleAssignDoctor(item, val)}
                    >
                      <SelectTrigger className="h-7 text-xs w-44 ml-auto">
                        <SelectValue placeholder="Assign practitioner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {doctorList.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </>
              )}

              {type === "stale" && (
                <>
                  <TableCell className="py-2 text-xs font-semibold text-primary">
                    {item.first_name || ""} {item.last_name || ""}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <Badge variant="outline" className="text-[10px] scale-90 origin-left">
                      {item.pipelineStage}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">
                    {item.assigned_user?.name || "Unassigned"}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="date"
                          className="h-7 text-xs w-32 py-1"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          disabled={loadingId === item.id}
                          onClick={() => handleCreateFollowup(item.id)}
                        >
                          Create task
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] px-2 text-muted-foreground"
                          onClick={() => {
                            setEditingId(null);
                            setCustomDate("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1 px-2 border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => {
                          setEditingId(item.id);
                          setCustomDate(moment().add(1, "day").format("YYYY-MM-DD"));
                        }}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>Schedule Followup</span>
                      </Button>
                    )}
                  </TableCell>
                </>
              )}

              {type === "lost-no-reason" && (
                <>
                  <TableCell className="py-2 text-xs font-semibold text-primary">
                    {item.first_name || ""} {item.last_name || ""}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    {moment(item.updatedAt).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">
                    {item.assigned_user?.name || "Unassigned"}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Input
                          placeholder="Reason for cancellation..."
                          className="h-7 text-xs w-56 py-1"
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          disabled={loadingId === item.id}
                          onClick={() => handleSaveLossReason(item.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] px-2 text-muted-foreground"
                          onClick={() => {
                            setEditingId(null);
                            setCustomValue("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1 px-2 border-rose-500/20 text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          setEditingId(item.id);
                          setCustomValue("");
                        }}
                      >
                        <AlertCircle className="h-3 w-3" />
                        <span>Provide Reason</span>
                      </Button>
                    )}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
