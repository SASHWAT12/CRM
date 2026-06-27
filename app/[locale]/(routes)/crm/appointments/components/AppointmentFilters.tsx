"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Plus, X, Search } from "lucide-react";
import NewAppointmentForm from "../../contacts/[contactId]/components/NewAppointmentForm";
import useDebounce from "@/hooks/useDebounce";

export function AppointmentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  const status = searchParams?.get("status") || "ALL";
  const patientId = searchParams?.get("patientId") || "";
  const search = searchParams?.get("search") || "";

  const [searchText, setSearchText] = useState(search);
  const debouncedSearch = useDebounce(searchText, 300);

  const updateFilters = (newStatus: string, newPatientId: string, newSearch: string) => {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
    if (newPatientId) params.set("patientId", newPatientId);
    if (newSearch) params.set("search", newSearch);
    router.push(`/crm/appointments?${params.toString()}`);
  };

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters(status, patientId, debouncedSearch);
    }
  }, [debouncedSearch]);

  // Reset local search text when search param changes externally (e.g. on clear)
  useEffect(() => {
    setSearchText(search);
  }, [search]);

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 bg-muted/30 p-4 rounded-lg border">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto flex-1">
        {/* Search Input */}
        <div className="flex flex-col gap-1 w-full sm:w-[220px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Appointments</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient, doctor, notes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8 h-9 text-sm"
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

        {/* Filter by Patient */}
        <div className="flex flex-col gap-1 w-full sm:w-[200px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by Patient</span>
          <div className="flex gap-1 items-center">
            <PatientSearchCombobox
              value={patientId}
              onChange={(id) => updateFilters(status, id, searchText)}
            />
            {patientId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateFilters(status, "", searchText)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter by Status */}
        <div className="flex flex-col gap-1 w-full sm:w-[150px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by Status</span>
          <Select
            value={status}
            onValueChange={(val) => updateFilters(val, patientId, searchText)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="NO_SHOW">No Show</SelectItem>
              <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetTrigger asChild>
          <Button className="gap-1 cursor-pointer w-full md:w-auto shrink-0 mt-4 md:mt-0">
            <Plus className="h-4 w-4" />
            <span>Book Appointment</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Book Appointment</SheetTitle>
            <SheetDescription>
              Schedule a new patient consultation with a doctor, staff assignment, date, and notes
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <NewAppointmentForm
              onFinish={() => setCreateOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
