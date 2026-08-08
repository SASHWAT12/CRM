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
import { createFollowup } from "@/actions/crm/followups/create-followup";
import { PatientSearchCombobox } from "@/components/ui/patient-search-combobox";

interface NewPatientFollowupFormProps {
  contactId?: string;
  onFinish: () => void;
}

const NewPatientFollowupForm = ({ contactId, onFinish }: NewPatientFollowupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>();

  const router = useRouter();

  const formSchema = z.object({
    title: z.string().min(3).max(255),
    user: z.string().min(3).max(255),
    contact: z.string().min(1, "Patient is required"),
    dueDateAt: z.date().optional(),
    priority: z.string().min(3).max(10),
    content: z.string().min(3).max(500),
  });

  type NewPatientTaskFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewPatientTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contact: contactId ?? "",
      title: "",
      user: "",
      priority: "medium",
      content: "",
    },
  });

  const onSubmit = async (data: NewPatientTaskFormValues) => {
    setIsLoading(true);
    try {
      const result = await createFollowup({
        title: data.title,
        user: data.user,
        priority: data.priority,
        content: data.content,
        contact: data.contact,
        dueDateAt: data.dueDateAt,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`New followup: ${data.title}, created successfully`);
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Something went wrong while creating the followup");
    } finally {
      setIsLoading(false);
      onFinish();
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
        <div className="flex w-full ">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="h-full w-full space-y-3"
            >
              <div className="flex flex-col space-y-3">
                {!contactId && (
                  <FormField
                    control={form.control}
                    name="contact"
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
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New followup name</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isLoading}
                          placeholder="Enter followup name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Followup description</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isLoading}
                          placeholder="Enter followup description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDateAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Followup due date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
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
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned to</FormLabel>
                      <FormControl>
                        <UserSearchCombobox
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Select assigned user"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose followup priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select followup priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex w-full justify-end space-x-2 pt-2">
                <SheetTrigger asChild>
                  <Button variant={"destructive"}>Close</Button>
                </SheetTrigger>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
};

export default NewPatientFollowupForm;
