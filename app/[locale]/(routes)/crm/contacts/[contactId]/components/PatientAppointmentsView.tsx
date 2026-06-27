"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, User, Clock, MoreHorizontal, Edit, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateAppointment } from "@/actions/crm/appointments/update-appointment";
import NewAppointmentForm from "./NewAppointmentForm";

interface Appointment {
  id: string;
  v: number;
  patientId: string;
  doctorId: string;
  staffId: string | null;
  scheduledAt: Date | string;
  duration: number;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
  notes: string | null;
  doctor: { name: string | null; id: string };
  staff?: { name: string | null; id: string } | null;
}

interface PatientAppointmentsViewProps {
  data: Appointment[];
  contactId: string;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  NO_SHOW: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  RESCHEDULED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

export const PatientAppointmentsView = ({ data, contactId }: PatientAppointmentsViewProps) => {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusTransition = async (appointment: Appointment, newStatus: Appointment["status"]) => {
    setActionLoading(appointment.id);
    try {
      const result = await updateAppointment({
        id: appointment.id,
        v: appointment.v,
        status: newStatus,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Appointment marked as ${newStatus.toLowerCase()}`);
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Something went wrong while transitioning status");
    } finally {
      setActionLoading(null);
      router.refresh();
    }
  };

  const openEditSheet = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setEditOpen(true);
  };

  return (
    <Card className="transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Schedule, track, and review consultation history</CardDescription>
          </div>
          <div>
            <Sheet open={createOpen} onOpenChange={setCreateOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-1 cursor-pointer">
                  + Add Appointment
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>New Appointment</SheetTitle>
                  <SheetDescription>
                    Schedule a new appointment for this patient with a practitioner, date, and notes
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <NewAppointmentForm
                    contactId={contactId}
                    onFinish={() => setCreateOpen(false)}
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
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-background text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-50" />
            <span>No appointments scheduled yet</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Staff</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/10">
                    <td className="p-3 font-medium whitespace-nowrap">
                      {format(new Date(appt.scheduledAt), "PPP p")}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{appt.doctor?.name ?? "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {appt.staff?.name ?? "None"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{appt.duration} mins</span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Badge variant="outline" className={STATUS_COLORS[appt.status]}>
                        {appt.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-muted-foreground" title={appt.notes ?? ""}>
                      {appt.notes ?? "—"}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "RESCHEDULED" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              disabled={actionLoading === appt.id}
                              onClick={() => handleStatusTransition(appt, "COMPLETED")}
                              title="Mark Completed"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              disabled={actionLoading === appt.id}
                              onClick={() => handleStatusTransition(appt, "CANCELLED")}
                              title="Cancel Appointment"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === appt.id}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditSheet(appt)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusTransition(appt, "CONFIRMED")} disabled={appt.status === "CONFIRMED"}>
                              Mark Confirmed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusTransition(appt, "NO_SHOW")} disabled={appt.status === "NO_SHOW"}>
                              Mark No Show
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusTransition(appt, "RESCHEDULED")} disabled={appt.status === "RESCHEDULED"}>
                              Mark Rescheduled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Sheet for editing appointments */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Appointment</SheetTitle>
            <SheetDescription>
              Modify scheduling, practitioner, notes, or status for this appointment
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedAppointment && (
              <NewAppointmentForm
                contactId={contactId}
                appointment={selectedAppointment}
                onFinish={() => setEditOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
};

export default PatientAppointmentsView;
