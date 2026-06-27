import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getFollowups } from "@/actions/crm/tasks/get-followups";
import { TasksDataTable } from "../accounts/[accountId]/tasks-data-table/components/data-table";
import { columns } from "./components/columns";
import { FollowupFilters } from "./components/FollowupFilters";
import { CreateFollowupButton } from "./components/CreateFollowupButton";
import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, AlertCircle, CalendarDays } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    contactId?: string;
    skip?: string;
    take?: string;
  }>;
}

const FollowupsPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const status = searchParams.status || "ALL";
  const contactId = searchParams.contactId || undefined;
  const skip = searchParams.skip ? Number(searchParams.skip) : 0;
  const take = searchParams.take ? Number(searchParams.take) : 50;

  // 1. Fetch filtered tasks for the table
  const { tasks, total } = await getFollowups({ status, contactId, skip, take });

  // 2. Fetch all tasks for the selected contact (or all contacts if undefined) to calculate metrics
  const { tasks: allTasks } = await getFollowups({ status: "ALL", contactId, take: 1000 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const pendingCount = allTasks.filter((t: any) => t.taskStatus !== "COMPLETE").length;
  const overdueCount = allTasks.filter((t: any) => {
    if (t.taskStatus === "COMPLETE") return false;
    if (!t.dueDateAt) return false;
    return new Date(t.dueDateAt) < todayStart;
  }).length;
  const dueTodayCount = allTasks.filter((t: any) => {
    if (t.taskStatus === "COMPLETE") return false;
    if (!t.dueDateAt) return false;
    const d = new Date(t.dueDateAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  return (
    <Container
      title="Patient Followups"
      description="Track and manage followup tasks, due dates, and practitioner assignments"
    >
      <div className="space-y-6">
        {/* Summary cards at the top */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="transition-all duration-300 hover:shadow-md border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Followups
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{pendingCount}</div>
              <p className="text-[10px] text-muted-foreground">Tasks awaiting action</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Overdue Followups
              </CardTitle>
              <AlertCircle className={`h-4 w-4 ${overdueCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-destructive" : ""}`}>{overdueCount}</div>
              <p className="text-[10px] text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Due Today
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dueTodayCount}</div>
              <p className="text-[10px] text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-muted/10">
          <Suspense fallback={<div>Loading filters...</div>}>
            <FollowupFilters />
          </Suspense>
          <div className="flex shrink-0">
            <CreateFollowupButton />
          </div>
        </div>

        {/* List of Followups */}
        <Suspense fallback={<CrmTableSkeleton />}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-background text-muted-foreground">
              <span>No followups found.</span>
            </div>
          ) : (
            <TasksDataTable columns={columns} data={tasks as any} />
          )}
        </Suspense>
      </div>
    </Container>
  );
};

export default FollowupsPage;
