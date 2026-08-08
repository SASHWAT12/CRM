"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkbenchShell } from "@/app/[locale]/(routes)/components/ui/WorkbenchShell";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import NewAppointmentForm from "../../patients/[patientId]/components/NewAppointmentForm";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateAppointment } from "@/actions/crm/appointments/update-appointment";
import { 
  CalendarDays, 
  AlertCircle, 
  CheckSquare, 
  Plus, 
  X, 
  Search, 
  Clock, 
  User,
  CheckCircle,
  Play,
  ArrowRight,
  FileSpreadsheet
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

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
  patient: { id: string; first_name: string | null; last_name: string };
  doctor: { id: string; name: string | null };
  staff?: { id: string; name: string | null } | null;
}

interface AppointmentsWorkbenchClientProps {
  data: Appointment[];
  doctors: any[];
  counts: {
    today: number;
    tomorrow: number;
    completed: number;
    cancelled: number;
  };
  recentCompleted: any[];
  recentCancelled: any[];
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  NO_SHOW: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  RESCHEDULED: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
};

export function AppointmentsWorkbenchClient({
  data,
  doctors,
  counts,
  recentCompleted,
  recentCancelled,
}: AppointmentsWorkbenchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeQueue = searchParams?.get("queue") || "TODAY";
  const search = searchParams?.get("search") || "";
  const doctorId = searchParams?.get("doctorId") || "ALL";

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 300);

  const updateFilters = (newQueue: string, newSearch: string, newDoctor: string) => {
    const params = new URLSearchParams();
    if (newQueue && newQueue !== "TODAY") params.set("queue", newQueue);
    if (newSearch) params.set("search", newSearch);
    if (newDoctor && newDoctor !== "ALL") params.set("doctorId", newDoctor);
    router.push(`/crm/appointments?${params.toString()}`);
  };

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters(activeQueue, debouncedSearch, doctorId);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchText(search);
  }, [search]);

  // Handle KPI Click Shortcuts to trigger queue changes
  const handleQueueSelect = (queueId: string) => {
    updateFilters(queueId, searchText, doctorId);
  };

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
      toast.error(error?.message ?? "Something went wrong");
    } finally {
      setActionLoading(null);
      router.refresh();
    }
  };

  const openEditSheet = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setEditOpen(true);
  };

  // Summary Queue Selection Cards
  const queues = [
    { 
      id: "TODAY", 
      label: "Today's Schedule", 
      count: counts.today, 
      icon: <CalendarDays className="h-4 w-4" />, 
      description: "Consultations scheduled today",
      variant: "default" as const
    },
    { 
      id: "TOMORROW", 
      label: "Tomorrow's Schedule", 
      count: counts.tomorrow, 
      icon: <Clock className="h-4 w-4" />, 
      description: "All appointments scheduled tomorrow",
      variant: "warning" as const
    },
    { 
      id: "NOSHOW_CANCELLED", 
      label: "Missed / Cancelled", 
      count: counts.cancelled, 
      icon: <AlertCircle className="h-4 w-4" />, 
      description: "Needs callback scheduling",
      variant: "danger" as const
    },
    { 
      id: "COMPLETED", 
      label: "Completed Today", 
      count: counts.completed, 
      icon: <CheckCircle className="h-4 w-4" />, 
      description: "Completed consultations today",
      variant: "success" as const
    },
  ];

  // Actions
  const createActions = (
    <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 cursor-pointer">
      <Plus className="h-3.5 w-3.5" />
      <span>Book Consultation</span>
    </Button>
  );

  const browseActions = (
    <Button size="sm" variant="ghost" asChild className="gap-1 cursor-pointer text-muted-foreground hover:text-foreground">
      <Link href="/crm/appointments/registry">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        <span>Open Registry</span>
      </Link>
    </Button>
  );

  // Filters toolbar layout
  const filters = (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full justify-between">
      <div className="flex items-center gap-2 flex-1 w-full sm:max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchText("")}
              className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={doctorId}
          onValueChange={(val) => updateFilters(activeQueue, searchText, val)}
        >
          <SelectTrigger className="h-9 text-xs w-[160px]">
            <SelectValue placeholder="All Doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Doctors</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Recent Activity Panel View
  const recentActivity = (
    <div className="space-y-4">
      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span>Completed today</span>
        </h5>
        {recentCompleted.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No consults completed today</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentCompleted.map((rc) => (
              <li key={rc.id}>
                <span className="font-semibold text-foreground block">
                  {rc.patient ? `${rc.patient.first_name || ""} ${rc.patient.last_name}` : "Patient"}
                </span>
                <span>Dr. {rc.doctor?.name || "Doctor"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <X className="h-3.5 w-3.5 text-rose-500" />
          <span>Cancelled today</span>
        </h5>
        {recentCancelled.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No cancellations today</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentCancelled.map((rc) => (
              <li key={rc.id}>
                <span className="font-semibold text-foreground block">
                  {rc.patient ? `${rc.patient.first_name || ""} ${rc.patient.last_name}` : "Patient"}
                </span>
                <span>Cancelled callback flagged</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // Empty state configuration
  const renderEmptyState = () => {
    let icon = <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto" />;
    let title = "No appointments found";
    let description = "There are no appointments currently scheduled in this queue view.";
    let showAction = true;

    if (activeQueue === "TODAY") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "No appointments scheduled today.";
      description = "There are no patient consultations scheduled for today.";
    } else if (activeQueue === "TOMORROW") {
      icon = <CalendarDays className="h-8 w-8 text-muted-foreground/60 mx-auto" />;
      title = "No appointments scheduled tomorrow.";
      description = "There are no patient consultations scheduled for tomorrow.";
    } else if (activeQueue === "NOSHOW_CANCELLED") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "No appointments currently require rescheduling.";
      description = "No missed or cancelled consultations require attention today.";
      showAction = false;
    } else if (activeQueue === "COMPLETED") {
      icon = <CalendarDays className="h-8 w-8 text-muted-foreground/60 mx-auto" />;
      title = "No appointments completed today.";
      description = "No consultations have been marked as completed today.";
      showAction = false;
    }

    return (
      <div className="text-center py-12 px-4 border border-dashed rounded-lg bg-muted/5 space-y-4">
        {icon}
        <div className="space-y-1.5 max-w-sm mx-auto">
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {showAction && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 mx-auto">
            <Plus className="h-4 w-4" />
            <span>Book Appointment</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <WorkbenchShell
        moduleTitle="Daily Schedule Board"
        moduleIdentity="Patient Consultations & Practitioner Coverage"
        queues={queues}
        activeQueue={activeQueue}
        onQueueSelect={handleQueueSelect}
        createActions={createActions}
        browseActions={browseActions}
        filters={filters}
        recentActivity={recentActivity}
      >
        {data.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((appt) => (
              <Card key={appt.id} className="hover:shadow-md transition-all border border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link 
                        href={`/crm/patients/${appt.patientId}`}
                        className="text-sm font-bold hover:underline text-primary"
                      >
                        {appt.patient ? `${appt.patient.first_name ?? ""} ${appt.patient.last_name}` : "Unknown Patient"}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(appt.scheduledAt), "PPP p")} ({appt.duration} mins)
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0.5 px-1.5", STATUS_COLORS[appt.status])}>
                      {appt.status.toLowerCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Doctor:</span> {appt.doctor?.name || "Unassigned"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Staff Coordinator:</span> {appt.staff?.name || "Awaiting"}
                    </div>
                  </div>

                  {appt.notes && (
                    <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border truncate max-w-full" title={appt.notes}>
                      <span className="font-semibold text-foreground mr-1">Notes:</span> {appt.notes}
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-1.5 border-t border-border/20">
                    <Button size="sm" variant="ghost" onClick={() => openEditSheet(appt)} className="h-7 text-[10px] px-2 text-muted-foreground">
                      Edit details
                    </Button>
                    
                    <div className="flex gap-1.5">
                      {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "RESCHEDULED") && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={actionLoading === appt.id}
                            onClick={() => handleStatusTransition(appt, "CANCELLED")}
                            className="h-7 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 px-2"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            disabled={actionLoading === appt.id}
                            onClick={() => handleStatusTransition(appt, "COMPLETED")}
                            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                          >
                            Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </WorkbenchShell>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Book Appointment</SheetTitle>
            <SheetDescription>
              Schedule a patient consultation date, doctor assignment, and session notes.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <NewAppointmentForm
              onFinish={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Appointment</SheetTitle>
            <SheetDescription>
              Modify scheduling, practitioner, notes, or status for this appointment.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedAppointment && (
              <NewAppointmentForm
                appointment={selectedAppointment}
                onFinish={() => setEditOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
