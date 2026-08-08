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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NewPatientFollowupForm from "../../patients/[patientId]/components/NewPatientFollowupForm";
import UpdateTaskForm from "./UpdateTaskForm";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateFollowup } from "@/actions/crm/followups/update-followup";
import { 
  CheckSquare, 
  AlertCircle, 
  Plus, 
  X, 
  Search, 
  Clock, 
  CheckCircle,
  Play,
  ArrowRight,
  FileSpreadsheet,
  CalendarDays
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

interface FollowupTask {
  id: string;
  v: number;
  contact: string | null;
  user: string;
  dueDateAt: Date | string;
  title: string;
  content: string | null;
  taskStatus: "ACTIVE" | "COMPLETE";
  priority: "high" | "medium" | "low";
  assigned_user: { id: string; name: string | null };
  crm_contact: { id: string; first_name: string | null; last_name: string } | null;
}

interface FollowupsWorkbenchClientProps {
  data: FollowupTask[];
  users: any[];
  counts: {
    pending: number;
    overdue: number;
    dueToday: number;
    completedToday: number;
    total: number;
  };
  recentCompleted: any[];
  recentRescheduled: any[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  medium: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  low: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
};

export function FollowupsWorkbenchClient({
  data,
  users,
  counts,
  recentCompleted,
  recentRescheduled,
}: FollowupsWorkbenchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FollowupTask | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const activeQueue = searchParams?.get("queue") || "DUE_TODAY";
  const search = searchParams?.get("search") || "";
  const userId = searchParams?.get("userId") || "ALL";

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 300);

  const updateFilters = (newQueue: string, newSearch: string, newAssigned: string) => {
    const params = new URLSearchParams();
    if (newQueue && newQueue !== "DUE_TODAY") params.set("queue", newQueue);
    if (newSearch) params.set("search", newSearch);
    if (newAssigned && newAssigned !== "ALL") params.set("userId", newAssigned);
    router.push(`/crm/followups?${params.toString()}`);
  };

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters(activeQueue, debouncedSearch, userId);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchText(search);
  }, [search]);

  // Handle KPI Click Shortcuts to trigger queue changes
  const handleQueueSelect = (queueId: string) => {
    updateFilters(queueId, searchText, userId);
  };

  const handleStatusTransition = async (task: FollowupTask, newStatus: "ACTIVE" | "COMPLETE") => {
    setActionLoading(task.id);
    try {
      const result = await updateFollowup({
        id: task.id,
        taskStatus: newStatus,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Task marked as ${newStatus.toLowerCase()}`);
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Something went wrong");
    } finally {
      setActionLoading(null);
      router.refresh();
    }
  };

  const openEditSheet = (task: FollowupTask) => {
    setSelectedTask(task);
    setEditOpen(true);
  };

  // Reusable KPIs summary row layout
  const queues = [
    { 
      id: "DUE_TODAY", 
      label: "Due Today", 
      count: counts.dueToday, 
      icon: <CalendarDays className="h-4 w-4" />, 
      description: "Callbacks scheduled today",
      variant: "default" as const
    },
    { 
      id: "OVERDUE", 
      label: "Overdue Callbacks", 
      count: counts.overdue, 
      icon: <AlertCircle className="h-4 w-4" />, 
      description: "Tasks past due date",
      variant: "danger" as const
    },
    { 
      id: "COMPLETED", 
      label: "Completed Today", 
      count: counts.completedToday, 
      icon: <CheckSquare className="h-4 w-4" />, 
      description: "Completed during shift",
      variant: "success" as const
    },
    { 
      id: "UPCOMING", 
      label: "Upcoming Callbacks", 
      count: counts.total, 
      icon: <Clock className="h-4 w-4" />, 
      description: "Future scheduled callbacks",
      variant: "default" as const
    },
  ];

  // Actions
  const createActions = (
    <Sheet open={createOpen} onOpenChange={setCreateOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1 cursor-pointer">
          <Plus className="h-3.5 w-3.5" />
          <span>Create Followup</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create new Followup</SheetTitle>
          <SheetDescription>
            Schedule a follow-up callback with assignments, due dates, and notes.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <NewPatientFollowupForm onFinish={() => setCreateOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );

  const browseActions = (
    <Button size="sm" variant="ghost" asChild className="gap-1 cursor-pointer text-muted-foreground hover:text-foreground">
      <Link href="/crm/followups/registry">
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
            placeholder="Search followups"
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
          value={userId}
          onValueChange={(val) => updateFilters(activeQueue, searchText, val)}
        >
          <SelectTrigger className="h-9 text-xs w-[160px]">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Staff</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
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
          <span>Completed</span>
        </h5>
        {recentCompleted.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent completions</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentCompleted.map((rc) => (
              <li key={rc.id}>
                <span className="font-semibold text-foreground block truncate" title={rc.title}>
                  {rc.title}
                </span>
                <span>For patient: {rc.crm_contact ? `${rc.crm_contact.first_name || ""} ${rc.crm_contact.last_name}` : "Unknown"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Rescheduled</span>
        </h5>
        {recentRescheduled.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No rescheduled callbacks</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentRescheduled.map((rr) => (
              <li key={rr.id}>
                <span className="font-semibold text-foreground block truncate" title={rr.title}>
                  {rr.title}
                </span>
                <span>New date: {format(new Date(rr.dueDateAt), "PP")}</span>
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
    let title = "No callbacks found";
    let description = "There are no tasks currently scheduled in this queue view.";
    let showAction = true;

    if (activeQueue === "DUE_TODAY") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "All Caught Up for Today!";
      description = "No follow-up callbacks are scheduled for today.";
    } else if (activeQueue === "OVERDUE") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "No Overdue Tasks!";
      description = "All callback tasks have been completed on time.";
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
            <span>Create Followup</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <WorkbenchShell
        moduleTitle="Callback Inbox"
        moduleIdentity="Urgent Callback Tasks & Patient Follow-ups"
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
            {data.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-all border border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link 
                        href={task.contact ? `/crm/patients/${task.contact}` : "#"}
                        className="text-sm font-bold hover:underline text-primary"
                      >
                        {task.crm_contact ? `${task.crm_contact.first_name || ""} ${task.crm_contact.last_name}` : "General Task"}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Due: {format(new Date(task.dueDateAt), "PP")}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0.5 px-1.5", PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </Badge>
                  </div>

                  <div className="space-y-1 bg-muted/30 p-2 rounded border">
                    <span className="font-semibold text-foreground text-[10px] block truncate" title={task.title}>
                      {task.title}
                    </span>
                    {task.content && (
                      <p className="text-[10px] text-muted-foreground leading-snug truncate" title={task.content}>
                        {task.content}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Staff Assigned:</span> {task.assigned_user?.name || "Unassigned"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Status:</span> {task.taskStatus.toLowerCase()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-border/20">
                    <Button size="sm" variant="ghost" onClick={() => openEditSheet(task)} className="h-7 text-[10px] px-2 text-muted-foreground">
                      Edit details
                    </Button>
                    
                    <div className="flex gap-1.5">
                      {task.taskStatus === "ACTIVE" && (
                        <Button 
                          size="sm" 
                          disabled={actionLoading === task.id}
                          onClick={() => handleStatusTransition(task, "COMPLETE")}
                          className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 animate-pulse"
                        >
                          Complete Callback
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </WorkbenchShell>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Followup</SheetTitle>
            <SheetDescription>
              Modify callback scheduling, assignee, details, or status notes.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedTask && (
              <UpdateTaskForm
                initialData={selectedTask}
                onFinish={() => setEditOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
