"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/user/update-profile";

interface ProfileFormProps {
  data: any;
}

const FormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z.string().optional().nullable(),
  email: z.string(),
  account_name: z.string().optional().nullable(),
});

export function ProfileForm({ data }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: data?.id || "",
      name: data?.name || "",
      username: data?.username || "",
      email: data?.email || "",
      account_name: data?.account_name || "",
    },
  });

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      const result = await updateProfile({
        userId: values.id,
        name: values.name,
        username: values.username || undefined,
        account_name: values.account_name || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Profile updated successfully");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred while saving profile.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input disabled={isLoading} placeholder="Full Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input disabled={true} type="email" readOnly className="bg-muted cursor-not-allowed" {...field} />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Email is managed by the system administrator.
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="Username" value={field.value || ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization / Account</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="Account Name" value={field.value || ""} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? "Saving Changes..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}
