"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { inviteUser } from "@/actions/admin/users/invite-user";

const FormSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.string().min(2, "Please select a user role."),
});

interface UserFormProps {
  actorRole: string;
}

export function UserForm({ actorRole }: UserFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const t = useTranslations("AdminPage");

  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      const result = await inviteUser(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User created successfully");
        form.reset({
          name: "",
          email: "",
          role: "",
        });
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  }

  const isRoot = actorRole === "root";
  const isAdmin = actorRole === "admin";

  if (!isRoot && !isAdmin) {
    return null;
  }

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm max-w-4xl">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-foreground">Create User</h3>
        <p className="text-sm text-muted-foreground">Add a new internal user to the system.</p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full items-end"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full md:flex-1">
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full md:flex-1">
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    placeholder="name@domain.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="w-full md:w-[200px]">
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isRoot && <SelectItem value="admin">Administrator</SelectItem>}
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="counsellor">Counsellor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full md:w-auto px-6 h-10" type="submit" disabled={isLoading}>
            {isLoading ? (
              <Icons.spinner className="animate-spin" />
            ) : (
              "Create User"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
