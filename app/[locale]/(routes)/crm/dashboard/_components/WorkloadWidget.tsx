"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, ClipboardList, Stethoscope } from "lucide-react";

interface CounselorWorkload {
  id: string;
  name: string;
  role: string;
  activePatientsCount: number;
  overdueFollowupsCount: number;
}

interface DoctorWorkload {
  id: string;
  name: string;
  appointmentsCount: number;
}

interface WorkloadWidgetProps {
  counselorWorkload: CounselorWorkload[];
  doctorWorkload: DoctorWorkload[];
  isLoading?: boolean;
}

export function WorkloadWidget({
  counselorWorkload = [],
  doctorWorkload = [],
  isLoading,
}: WorkloadWidgetProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse border-primary/10">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent className="h-40 bg-muted rounded" />
      </Card>
    );
  }

  return (
    <Card className="border-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Team Workload Distribution</CardTitle>
        <CardDescription>Active patient loads and scheduled consultations by staff</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Counselors Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground tracking-wide">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span>Staff Load</span>
          </div>
          {counselorWorkload.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No staff members registered.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Staff Name</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Active Patients</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Overdue Work</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counselorWorkload.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-muted/10">
                      <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{staff.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          ({staff.role})
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 text-center font-bold text-xs">
                        {staff.activePatientsCount}
                      </TableCell>
                      <TableCell className="py-2.5 text-center">
                        {staff.overdueFollowupsCount > 0 ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                            {staff.overdueFollowupsCount} Overdue
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Doctors Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground tracking-wide">
            <Stethoscope className="h-4 w-4 text-emerald-500" />
            <span>Practitioners Load</span>
          </div>
          {doctorWorkload.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No active practitioners registered.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="h-8 text-[11px] font-bold uppercase">Practitioner</TableHead>
                    <TableHead className="h-8 text-[11px] font-bold uppercase text-center">Appointments scheduled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorWorkload.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/10">
                      <TableCell className="py-2.5 font-semibold text-xs flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{doc.name}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-center font-bold text-xs">
                        {doc.appointmentsCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
