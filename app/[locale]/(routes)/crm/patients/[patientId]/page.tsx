import Container from "@/app/[locale]/(routes)/components/ui/Container";

import { BasicView } from "./components/BasicView";

import { getPatient } from "@/actions/crm/get-patient";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getPatientFollowups } from "@/actions/crm/patients/get-followups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTab } from "./components/HistoryTab";
import { PatientTimelineSection } from "./components/PatientTimelineSection";
import PatientFollowupsView from "./components/PatientFollowupsView";
import PatientAppointmentsView from "./components/PatientAppointmentsView";
import { getAppointments } from "@/actions/crm/appointments/get-appointments";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import moment from "moment";
import { User, CheckSquare, AlertCircle, CalendarDays, Activity } from "lucide-react";

const PatientViewPage = async (props: any) => {
  const params = await props.params;
  const { patientId } = params;
  const contact: any = await getPatient(patientId);
  const crmData = await getAllCrmData();
  const tasks = await getPatientFollowups(patientId);
  const appointments = await getAppointments({ patientId });

  //  console.log(accounts, "accounts");

  if (!contact) return <div>Patient not found</div>;

  const now = new Date();

  // 1. Assigned Staff
  const assignedStaffName = contact.assigned_to_user?.name || "Unassigned";

  // 2. Open Followups
  const openFollowupsCount = tasks.filter((t: any) => t.taskStatus !== "COMPLETE").length;

  // 3. Overdue Followups
  const overdueFollowupsCount = tasks.filter((t: any) => {
    if (t.taskStatus === "COMPLETE") return false;
    if (!t.dueDateAt) return false;
    return new Date(t.dueDateAt) < now;
  }).length;

  // 4. Next Followup Date
  const futureTasks = tasks.filter((t: any) => {
    if (t.taskStatus === "COMPLETE") return false;
    if (!t.dueDateAt) return false;
    return new Date(t.dueDateAt) > now;
  });
  const sortedFutureTasks = [...futureTasks].sort(
    (a: any, b: any) => new Date(a.dueDateAt!).getTime() - new Date(b.dueDateAt!).getTime()
  );
  const nextFollowupDate = sortedFutureTasks.length > 0 ? sortedFutureTasks[0].dueDateAt : null;
  const nextFollowupStr = nextFollowupDate ? moment(nextFollowupDate).format("YYYY-MM-DD") : "None Scheduled";

  // 5. Last Activity Date
  const lastActivityStr = contact.last_activity ? moment(contact.last_activity).format("YYYY-MM-DD") : "None";

  return (
    <Container
      title={`Patient detail view: ${contact?.first_name} ${contact?.last_name}`}
      description={"Everything you need to know about the patient profile and status"}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assigned Staff
            </CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{assignedStaffName}</div>
            <p className="text-[10px] text-muted-foreground">Primary practitioner</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open Followups
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{openFollowupsCount}</div>
            <p className="text-[10px] text-muted-foreground">Tasks awaiting action</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue Followups
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueFollowupsCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueFollowupsCount > 0 ? "text-destructive" : ""}`}>{overdueFollowupsCount}</div>
            <p className="text-[10px] text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Followup
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{nextFollowupStr}</div>
            <p className="text-[10px] text-muted-foreground">Scheduled upcoming</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Last Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{lastActivityStr}</div>
            <p className="text-[10px] text-muted-foreground">Patient record update</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="followups">Followups</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-5">
            <BasicView data={contact} />
            <PatientTimelineSection contactId={contact.id} />
          </div>
        </TabsContent>
        <TabsContent value="appointments">
          <PatientAppointmentsView data={appointments} contactId={patientId} />
        </TabsContent>
        <TabsContent value="followups">
          <PatientFollowupsView contactId={patientId} data={tasks} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab contactId={patientId} />
        </TabsContent>
      </Tabs>
    </Container>
  );
};

export default PatientViewPage;
