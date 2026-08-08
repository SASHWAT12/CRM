"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { updateFollowup } from "@/actions/crm/followups/update-followup";

const formSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().optional(),
  dueDateAt: z.date().nullable().optional(),
  priority: z.string(),
  taskStatus: z.string(),
  user: z.string().nullable().optional(),
});

type UpdateTaskFormValues = z.infer<typeof formSchema>;

interface UpdateTaskFormProps {
  initialData: {
    id: string;
    title: string;
    content: string | null;
    dueDateAt: Date | string | null;
    priority: string;
    taskStatus: string;
    user: string | null;
  };
  onFinish: () => void;
}

export default function UpdateTaskForm({ initialData, onFinish }: UpdateTaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title || "",
      content: initialData.content || "",
      dueDateAt: initialData.dueDateAt ? new Date(initialData.dueDateAt) : undefined,
      priority: initialData.priority || "medium",
      taskStatus: initialData.taskStatus || "ACTIVE",
      user: initialData.user || "",
    },
  });

  const onSubmit = async (data: UpdateTaskFormValues) => {
    setIsLoading(true);
    try {
      const result = await updateFollowup({
        id: initialData.id,
        title: data.title,
        content: data.content || "",
        dueDateAt: data.dueDateAt || null,
        priority: data.priority,
        taskStatus: data.taskStatus,
        user: data.user || null,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Followup updated successfully");
        onFinish();
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update followup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Followup title" disabled={isLoading} {...field} />
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
              <FormLabel>Details</FormLabel>
              <FormControl>
                <Textarea placeholder="Details or notes regarding the callback..." disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDateAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
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

          <FormField
            control={form.control}
            name="taskStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Pending)</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinish} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
