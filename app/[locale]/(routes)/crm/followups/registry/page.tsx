import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getFollowups } from "@/actions/crm/followups/get-followups";
import { TasksDataTable } from "../components/tasks-data-table/data-table";
import { columns } from "../components/columns";
import { FollowupFilters } from "../components/FollowupFilters";
import { CreateFollowupButton } from "../components/CreateFollowupButton";
import { Suspense } from "react";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    contactId?: string;
    skip?: string;
    take?: string;
  }>;
}

const FollowupsRegistryPage = async (props: PageProps) => {
  const searchParams = await props.searchParams;
  const status = searchParams.status || "ALL";
  const contactId = searchParams.contactId || undefined;
  const skip = searchParams.skip ? Number(searchParams.skip) : 0;
  const take = searchParams.take ? Number(searchParams.take) : 50;

  // Fetch full followups list with pagination parameters
  const { tasks } = await getFollowups({ status, contactId, skip, take, queue: "ALL" });

  return (
    <Container
      title="Patient Followups Registry"
      description="Full historical callback registry. Review past schedules and staff assignments"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg bg-muted/10">
          <Suspense fallback={<div>Loading filters...</div>}>
            <FollowupFilters />
          </Suspense>
          <div className="flex shrink-0">
            <CreateFollowupButton />
          </div>
        </div>

        <Suspense fallback={<CrmTableSkeleton />}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-background text-muted-foreground">
              <span>No followups found in registry.</span>
            </div>
          ) : (
            <TasksDataTable columns={columns} data={tasks as any} />
          )}
        </Suspense>
      </div>
    </Container>
  );
};

export default FollowupsRegistryPage;
