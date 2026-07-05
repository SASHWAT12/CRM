import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { requireAuthenticated, isAdmin, isManagerOrAdmin } from "@/lib/authz";
import { getLauncherMetrics } from "@/actions/crm/dashboard/providers/launcher";
import Link from "next/link";
import Container from "./components/ui/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Coins,
  CalendarDays,
  CheckSquare,
  FileBarChart,
  Wrench,
  LayoutDashboard,
  Eye,
  ArrowRight
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LauncherPage = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const userAuthz = await requireAuthenticated();

  // Fetch lightweight launcher metrics
  const metrics = await getLauncherMetrics(session.user.id, session.user.role);

  // Configuration-driven module metadata definition
  const launcherModules = [
    {
      title: "Patients",
      description: "Manage active prospective patients, clinical stages, and treatment progress.",
      icon: Users,
      href: "/crm/patients",
      visible: true,
    },
    {
      title: "Leads",
      description: "Track initial inquiries, channels conversion, and lead sources.",
      icon: Coins,
      href: "/crm/leads",
      visible: true,
    },
    {
      title: "Appointments",
      description: "Schedule clinical consultations, practitioner assignments, and visit statuses.",
      icon: CalendarDays,
      href: "/crm/appointments",
      visible: true,
    },
    {
      title: "Followups",
      description: "Organize patient callback dates, task priorities, and follow-up activities.",
      icon: CheckSquare,
      href: "/crm/followups",
      visible: true,
    },
    {
      title: "Reports",
      description: "Access lead source conversion, sales metrics, and activity reports.",
      icon: FileBarChart,
      href: "/reports",
      visible: isManagerOrAdmin(userAuthz),
    },
    {
      title: "Administration",
      description: "Configure hospital system settings, user roles, and team permissions.",
      icon: Wrench,
      href: "/admin",
      visible: isAdmin(userAuthz),
    },
  ];

  return (
    <Container
      title="MmrhCRM"
      description="Welcome to your hospital lead management and patient conversion workspace."
    >
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        
        {/* 1. Top Hero Section */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
          <div className="p-8 md:p-12 space-y-6 max-w-3xl">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-primary">
                MmrhCRM Launcher
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Hospital Lead Management & Patient Conversion CRM. Easily access your core workspaces, review schedule counts, and launch operational dashboards.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button asChild className="gap-2 shadow-sm">
                <Link href="/crm/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open CRM Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-background/50 hover:bg-background/80">
                <Link href="/crm/dashboard/user">
                  <Eye className="h-4 w-4" />
                  <span>My Workspace</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Light Operational Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Due Followups</p>
                <p className="text-xl font-bold mt-0.5">{metrics.dueFollowups}</p>
              </div>
              <CheckSquare className="h-5 w-5 text-primary/60" />
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Today's Visits</p>
                <p className="text-xl font-bold mt-0.5">{metrics.todayAppointments}</p>
              </div>
              <CalendarDays className="h-5 w-5 text-emerald-500/60" />
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/10 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Leads</p>
                <p className="text-xl font-bold mt-0.5">{metrics.openLeads}</p>
              </div>
              <Coins className="h-5 w-5 text-amber-500/60" />
            </CardContent>
          </Card>

          <Card className="bg-violet-500/5 border-violet-500/10 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tracked Patients</p>
                <p className="text-xl font-bold mt-0.5">{metrics.activePatients}</p>
              </div>
              <Users className="h-5 w-5 text-violet-500/60" />
            </CardContent>
          </Card>
        </div>

        {/* 3. Module Launcher Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspaces & Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {launcherModules
              .filter((module) => module.visible)
              .map((module) => {
                const IconComponent = module.icon;
                return (
                  <Link key={module.href} href={module.href}>
                    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:bg-muted/10 cursor-pointer h-full flex flex-col justify-between">
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        <CardTitle className="text-base font-bold mt-4 group-hover:text-primary transition-colors">
                          {module.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 text-xs text-muted-foreground leading-relaxed">
                        {module.description}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>

      </div>
    </Container>
  );
};

export default LauncherPage;
