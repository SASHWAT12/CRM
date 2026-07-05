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
import { NewLeadForm } from "../components/NewLeadForm";
import Link from "next/link";
import { 
  Coins, 
  AlertCircle, 
  CheckSquare, 
  Plus, 
  X, 
  Search, 
  Clock, 
  ShieldAlert, 
  CheckCircle,
  Play,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Flame,
  UserPlus
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";

interface LeadsWorkbenchClientProps {
  data: any[];
  crmData: any;
  users: any[];
  counts: {
    hot: number;
    newToday: number;
    untouched: number;
    needsFollowup: number;
    atRisk: number;
  };
  recentAssigned: any[];
  recentContacted: any[];
  recentConverted: any[];
}

export function LeadsWorkbenchClient({
  data,
  crmData,
  users,
  counts,
  recentAssigned,
  recentContacted,
  recentConverted,
}: LeadsWorkbenchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const activeQueue = searchParams?.get("queue") || "HOT";
  const search = searchParams?.get("search") || "";
  const assignedTo = searchParams?.get("assignedTo") || "ALL";

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 300);

  const { accounts, leadSources, leadStatuses, leadTypes } = crmData;

  const updateFilters = (newQueue: string, newSearch: string, newAssigned: string) => {
    const params = new URLSearchParams();
    if (newQueue && newQueue !== "HOT") params.set("queue", newQueue);
    if (newSearch) params.set("search", newSearch);
    if (newAssigned && newAssigned !== "ALL") params.set("assignedTo", newAssigned);
    router.push(`/crm/leads?${params.toString()}`);
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
      id: "HOT", 
      label: "Hot", 
      count: counts.hot, 
      icon: <Flame className="h-4 w-4" />, 
      description: "Priority leads pipeline",
      variant: "danger" as const
    },
    { 
      id: "NEW", 
      label: "Awaiting First Contact", 
      count: counts.newToday, 
      icon: <UserPlus className="h-4 w-4" />, 
      description: "Needs initial response",
      variant: "info" as const
    },
    { 
      id: "UNTOUCHED", 
      label: "Needs Follow-up", 
      count: counts.needsFollowup, 
      icon: <ShieldAlert className="h-4 w-4" />, 
      description: "Tasks overdue or missing",
      variant: "warning" as const
    },
    { 
      id: "RISK", 
      label: "At Risk", 
      count: counts.atRisk, 
      icon: <Clock className="h-4 w-4" />, 
      description: "Stagnant in pipeline",
      variant: "danger" as const
    },
  ];

  // Action components
  const createActions = (
    <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 cursor-pointer">
      <Plus className="h-3.5 w-3.5" />
      <span>New Lead</span>
    </Button>
  );

  const resumeActions = (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={() => handleQueueSelect("NEW")}
      className="gap-1 cursor-pointer border-primary/20 text-primary hover:bg-primary/5"
    >
      <Play className="h-3.5 w-3.5 fill-current" />
      <span>Resume Conversion</span>
    </Button>
  );

  const browseActions = (
    <Button size="sm" variant="ghost" asChild className="gap-1 cursor-pointer text-muted-foreground hover:text-foreground">
      <Link href="/crm/leads/registry">
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
            placeholder="Search within this queue..."
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
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Owners</SelectItem>
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
          <UserPlus className="h-3.5 w-3.5 text-blue-500" />
          <span>Recently Assigned</span>
        </h5>
        {recentAssigned.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent assignments</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentAssigned.map((ra) => (
              <li key={ra.id}>
                <Link href={`/crm/leads/${ra.id}`} className="font-semibold text-primary hover:underline block">
                  {ra.firstName || ""} {ra.lastName}
                </Link>
                <span>Assigned to onboarding</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
          <span>Recently Contacted</span>
        </h5>
        {recentContacted.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent contacts</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentContacted.map((rc) => (
              <li key={rc.id}>
                <Link href={`/crm/leads/${rc.id}`} className="font-semibold text-foreground hover:underline block">
                  {rc.firstName || ""} {rc.lastName}
                </Link>
                <span>Status set to Contacted</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
          <Coins className="h-3.5 w-3.5 text-emerald-500" />
          <span>Conversions</span>
        </h5>
        {recentConverted.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No recent conversions</p>
        ) : (
          <ul className="space-y-1.5 text-[11px] text-muted-foreground border-l pl-2 ml-1">
            {recentConverted.map((rc) => (
              <li key={rc.id}>
                <span className="font-semibold text-foreground block">
                  {rc.firstName || ""} {rc.lastName}
                </span>
                <span>Converted to Patient</span>
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
    let title = "No leads found";
    let description = "There are no open inquiries currently matching this queue context.";
    let showAction = true;

    if (activeQueue === "HOT") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "All Caught Up!";
      description = "No hot leads require immediate triage or response.";
      showAction = false;
    } else if (activeQueue === "UNTOUCHED") {
      icon = <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />;
      title = "All Leads Active";
      description = "Great job! All open leads have active followups scheduled.";
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
            <span>Register Lead</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <WorkbenchShell
        moduleTitle="Conversion Desk"
        moduleIdentity="Inquiry Validation & Lead Routing"
        queues={queues}
        activeQueue={activeQueue}
        onQueueSelect={handleQueueSelect}
        createActions={createActions}
        resumeActions={resumeActions}
        browseActions={browseActions}
        filters={filters}
        recentActivity={recentActivity}
      >
        {data.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-all border border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link 
                        href={`/crm/leads/${lead.id}`}
                        className="text-sm font-bold hover:underline text-primary"
                      >
                        {lead.firstName || ""} {lead.lastName}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{lead.email || "No email"}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-1.5">
                      {lead.lead_status?.name || "New"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Phone:</span> {lead.phone || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Owner:</span> {lead.assigned_to_user?.name || "Unassigned"}
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1.5">
                    <Button size="sm" variant="outline" asChild className="h-7 text-[10px] px-2.5">
                      <Link href={`/crm/leads/${lead.id}`}>
                        <span>Manage Conversion</span>
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
            <SheetTitle>Register Lead</SheetTitle>
            <SheetDescription>
              Input prospective lead channels, contact details, and assign an onboarding owner.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <NewLeadForm
              accounts={accounts}
              leadSources={leadSources}
              leadStatuses={leadStatuses}
              leadTypes={leadTypes}
              onFinish={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
