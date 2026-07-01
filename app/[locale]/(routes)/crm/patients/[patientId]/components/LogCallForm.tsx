"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logCall } from "@/actions/crm/activities/log-call";

interface LogCallFormProps {
  patientId: string;
  onFinish: () => void;
}

const formSchema = z.object({
  notes: z.string().min(5, "Notes must be at least 5 characters").max(500),
  outcome: z.string().min(1, "Outcome is required"),
  callbackScheduled: z.boolean().default(false),
  callbackDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function LogCallForm({ patientId, onFinish }: LogCallFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      outcome: "Completed",
      callbackScheduled: false,
    },
  });

  const callbackScheduled = form.watch("callbackScheduled");

  const onSubmit = async (values: any) => {
    if (values.callbackScheduled && !values.callbackDate) {
      form.setError("callbackDate", { message: "Callback date is required when scheduled" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await logCall({
        patientId,
        notes: values.notes,
        outcome: values.outcome,
        callbackScheduled: values.callbackScheduled,
        callbackDate: values.callbackDate,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Call logged successfully");
        onFinish();
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to log call");
    } finally {
      setIsLoading(false);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Outcome</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select call outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                      <SelectItem value="No Answer">No Answer</SelectItem>
                      <SelectItem value="Left Voicemail">Left Voicemail</SelectItem>
                      <SelectItem value="Missed Call">Missed Call</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Discussed treatment categories, patient requested consultation next week..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callbackScheduled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Schedule Callback</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Automatically schedule a follow-up task for this patient
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {callbackScheduled && (
              <FormField
                control={form.control}
                name="callbackDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Callback Due Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
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
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onFinish}>
                Cancel
              </Button>
              <Button type="submit">
                Log Call
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
