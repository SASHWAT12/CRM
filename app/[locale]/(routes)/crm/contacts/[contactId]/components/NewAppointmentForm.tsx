"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";
import { createAppointment } from "@/actions/crm/appointments/create-appointment";
import { updateAppointment } from "@/actions/crm/appointments/update-appointment";

interface NewAppointmentFormProps {
  contactId?: string;
  appointment?: {
    id: string;
    v: number;
    patientId: string;
    doctorId: string;
    staffId: string | null;
    scheduledAt: Date | string;
    duration: number;
    status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
    notes: string | null;
  };
  onFinish: () => void;
}

const NewAppointmentForm = ({ contactId, appointment, onFinish }: NewAppointmentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isEdit = !!appointment;

  const formSchema = z.object({
    patientId: z.string().uuid("Patient is required"),
    doctorId: z.string().uuid("Doctor is required"),
    staffId: z.string().uuid().or(z.literal("")).nullable().optional(),
    date: z.date({ message: "Date is required" }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    duration: z.string().min(1, "Duration is required"),
    status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"]).optional(),
    notes: z.string().max(500).optional().nullable(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const defaultDate = appointment ? new Date(appointment.scheduledAt) : undefined;
  const defaultTime = appointment ? format(new Date(appointment.scheduledAt), "HH:mm") : "09:00";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: contactId ?? appointment?.patientId ?? "",
      doctorId: appointment?.doctorId ?? "",
      staffId: appointment?.staffId ?? "",
      date: defaultDate,
      time: defaultTime,
      duration: appointment ? String(appointment.duration) : "30",
      status: appointment?.status ?? "SCHEDULED",
      notes: appointment?.notes ?? "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const scheduledAt = new Date(data.date);
      const [hours, minutes] = data.time.split(":");
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (isEdit && appointment) {
        const result = await updateAppointment({
          id: appointment.id,
          v: appointment.v,
          doctorId: data.doctorId,
          staffId: data.staffId === "" ? null : data.staffId,
          scheduledAt,
          duration: parseInt(data.duration),
          status: data.status,
          notes: data.notes,
        });

        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Appointment updated successfully");
          onFinish();
        }
      } else {
        const result = await createAppointment({
          patientId: data.patientId,
          doctorId: data.doctorId,
          staffId: data.staffId === "" ? null : data.staffId,
          scheduledAt,
          duration: parseInt(data.duration),
          notes: data.notes,
        });

        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Appointment created successfully");
          onFinish();
        }
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-col gap-2 py-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div className="flex w-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="h-full w-full space-y-4"
            >
              <div className="flex flex-col space-y-4">
                {/* Patient Selection (only on creation and if contactId is not passed) */}
                {!contactId && !isEdit && (
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Patient</FormLabel>
                        <FormControl>
                          <PatientSearchCombobox
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Practitioner selection: Doctor */}
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Doctor / Practitioner</FormLabel>
                      <FormControl>
                        <UserSearchCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Select Doctor"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Practitioner selection: Staff */}
                <FormField
                  control={form.control}
                  name="staffId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Assigned Staff (Optional)</FormLabel>
                      <FormControl>
                        <UserSearchCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Select Staff Member"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scheduling: Date and Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal text-sm",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (HH:MM)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 Minutes</SelectItem>
                          <SelectItem value="30">30 Minutes</SelectItem>
                          <SelectItem value="45">45 Minutes</SelectItem>
                          <SelectItem value="60">1 Hour</SelectItem>
                          <SelectItem value="90">1.5 Hours</SelectItem>
                          <SelectItem value="120">2 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status (Only visible on Edit) */}
                {isEdit && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lifecycle Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            <SelectItem value="NO_SHOW">No Show</SelectItem>
                            <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isLoading}
                          placeholder="Enter appointment / consultation notes"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex w-full justify-end space-x-2 pt-2">
                <SheetTrigger asChild>
                  <Button variant={"destructive"}>Close</Button>
                </SheetTrigger>
                <Button type="submit">{isEdit ? "Save Changes" : "Create Appointment"}</Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default NewAppointmentForm;
