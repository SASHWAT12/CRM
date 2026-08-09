"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkbenchShell } from "@/app/[locale]/(routes)/components/ui/WorkbenchShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NewPatientForm } from "../components/NewPatientForm";
import Link from "next/link";
import { 
  Users, 
  AlertCircle, 
  Plus, 
  X, 
  Search, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  Play,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

interface PatientsWorkbenchClientProps {
  data: any[];
  crmData: any;
  users: any[];
  counts: {
    recentlyConverted: number;
    needsFollowup: number;
    waitingResponse: number;
    missedConsult: number;
  };
  recentConversions: any[];
  recentFollowups: any[];
  recentAppointments: any[];
}

export function PatientsWorkbenchClient({
  data,
  crmData,
  users,
  counts,
  recentConversions,
  recentFollowups,
  recentAppointments,
}: PatientsWorkbenchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const activeQueue = searchParams?.get("queue") || "ATTENTION";
  const search = searchParams?.get("search") || "";
  const assignedTo = searchParams?.get("assignedTo") || "ALL";

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 300);

  const { contactTypes, leadSources } = crmData;

  const updateFilters = (newQueue: string, newSearch: string, newAssigned: string) => {
    const params = new URLSearchParams();
    if (newQueue) params.set("queue", newQueue);
    if (newSearch) params.set("search", newSearch);
    if (newAssigned && newAssigned !== "ALL") params.set("assignedTo", newAssigned);
    router.push(`/crm/patients?${params.toString()}`);
  };

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters(activeQueue, debouncedSearch, assignedTo);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchText(search);
  }, [search]);

  // Handle KPI Click Shortcuts to trigger queue changes
  const handleQueueSelect = (queueId: string) => {
    updateFilters(queueId, searchText, assignedTo);
  };

  // Reusable KPIs summary row layout
  const queues = [
    { 
      id: "ATTENTION", 
      label: "Needs Follow-up", 
      count: counts.needsFollowup, 
      icon: <ShieldAlert className="h-4 w-4" />, 
      description: "Tasks overdue or missing",
      variant: "danger" as const
    },
    { 
      id: "STALE", 
      label: "Waiting for Response", 
      count: counts.waitingResponse, 
      icon: <Clock className="h-4 w-4" />, 
      description: "Stagnant case updates",
      variant: "warning" as const
    },
    { 
      id: "MISSED", 
      label: "Missed Consultation", 
      count: counts.missedConsult, 
      icon: <AlertCircle className="h-4 w-4" />, 
      description: "Consultation no-shows",
      variant: "warning" as const
    },
    { 
      id: "CONVERTED", 
      label: "Recently Converted", 
      count: counts.recentlyConverted, 
      icon: <TrendingUp className="h-4 w-4" />, 
      description: "Converted in last 7 days",
      variant: "default" as const
    },
  ];

  // Action components
  const createActions = (
    <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 cursor-pointer">
      <Plus className="h-3.5 w-3.5" />
      <span>New Patient</span>
    </Button>
  );

  const browseActions = (
    <Button size="sm" variant="ghost" asChild className="gap-1 cursor-pointer text-muted-foreground hover:text-foreground">
      <Link href="/crm/patients/registry">
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
            placeholder="Search patients"
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
          value={assignedTo}
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
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span>Conversions</span>
        </h5>
        {recentConversions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent conversions</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentConversions.map((rc) => (
              <li key={rc.id}>
                <Link href={`/crm/patients/${rc.id}`} className="font-semibold text-primary hover:underline block">
                  {rc.first_name} {rc.last_name}
                </Link>
                <span>Converted to treatment</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
          <span>Followups Logged</span>
        </h5>
        {recentFollowups.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent followups</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentFollowups.map((rf) => (
              <li key={rf.id}>
                <span className="font-semibold text-foreground block truncate" title={rf.title}>
                  {rf.title}
                </span>
                <span>For patient: {rf.crm_contact ? `${rf.crm_contact.first_name || ""} ${rf.crm_contact.last_name}` : "Unknown"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Appointments</span>
        </h5>
        {recentAppointments.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent appointments</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentAppointments.map((ra) => (
              <li key={ra.id}>
                <span className="font-semibold text-foreground block">
                  Scheduled consultation
                </span>
                <span>Patient: {ra.patient ? `${ra.patient.first_name || ""} ${ra.patient.last_name}` : "Unknown"}</span>
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
    let title = "No patients found";
    let description = "There are no patient records currently matching this queue context.";
    let showAction = true;

    if (activeQueue === "ATTENTION") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "All Caught Up!";
      description = "No active patients have past due followups or are missing callback tasks.";
      showAction = false;
    } else if (activeQueue === "STALE") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "Zero Waiting Cases";
      description = "All active patients have active followups or have been updated recently.";
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
            <span>Register Patient</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <WorkbenchShell
        moduleTitle="Patient Operations"
        moduleIdentity="Patient Care & Treatment Tracking"
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
            {data.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-all border border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link 
                        href={`/crm/patients/${patient.id}`}
                        className="text-sm font-bold hover:underline text-primary"
                      >
                        {patient.first_name} {patient.last_name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{patient.email || "No email"}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-1.5">
                      {patient.pipelineStage?.toLowerCase().replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Phone:</span> {patient.mobile_phone || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Staff:</span> {patient.assigned_to_user?.name || "Unassigned"}
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1.5">
                    <Button size="sm" variant="outline" asChild className="h-7 text-[10px] px-2.5">
                      <Link href={`/crm/patients/${patient.id}`}>
                        <span>View Work Area</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
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
            <SheetTitle>New Patient Registration</SheetTitle>
            <SheetDescription>
              Register a prospective patient, assign a coordinator, and schedule the onboarding details.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <NewPatientForm
              contactTypes={contactTypes}
              leadSources={leadSources}
              users={crmData.users}
              onFinish={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
