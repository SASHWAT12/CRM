"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createPatient } from "@/actions/crm/patients/create-patient";
import { parseFullName } from "@/lib/crm/patient-name-parser";

type NewPatientFormProps = {
  contactTypes: { id: string; name: string }[];
  leadSources?: { id: string; name: string }[];
  users?: { id: string; name: string | null; email: string | null; role?: string | null }[];
  onFinish: () => void;
};

export function NewPatientForm({
  contactTypes,
  users = [],
  onFinish,
}: NewPatientFormProps) {
  const t = useTranslations("CrmPatientForm");
  const c = useTranslations("Common");

  // Filter users to ONLY doctor role (if role is present; if not provided, show active list)
  const doctorUsers = users.filter((u) => !u.role || u.role === "doctor");

  // Filter contact types to ONLY Kidney and IVF
  const filteredContactTypes = contactTypes.filter(
    (ct) =>
      ct.name.toLowerCase() === "kidney" || ct.name.toLowerCase() === "ivf"
  );

  const formSchema = z.object({
    name: z.string().trim().min(1, "Patient name is required"),
    age: z.string().optional(),
    phone: z.string().optional(),
    assigned_to: z.string().optional(),
    type: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      age: "",
      phone: "",
      assigned_to: "",
      type: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { first_name, last_name } = parseFullName(data.name);
      const parsedAge = data.age && data.age.trim() !== "" ? parseInt(data.age, 10) : undefined;

      const result = await createPatient({
        first_name,
        last_name,
        age: isNaN(parsedAge as any) ? undefined : parsedAge,
        mobile_phone: data.phone || undefined,
        assigned_to: data.assigned_to || undefined,
        contact_type_id: data.type || undefined,
        status: true,
      });

      if (result?.error) {
        form.setError("root.serverError", { message: result.error });
      } else {
        toast.success(t("createSuccess"));
        form.reset();
        onFinish();
      }
    } catch (err: any) {
      form.setError("root.serverError", { message: err?.message || "Failed to create patient" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
        <div className="w-full text-sm space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input
                    disabled={form.formState.isSubmitting}
                    placeholder="e.g. Rahul Sharma"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={form.formState.isSubmitting}
                    placeholder="e.g. 35"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    disabled={form.formState.isSubmitting}
                    placeholder="e.g. +1 555-0199"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Doctor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={form.formState.isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctorUsers.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name || doc.email || "Doctor"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={form.formState.isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient type (Kidney / IVF)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredContactTypes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-2 py-6">
          {form.formState.errors.root?.serverError && (
            <p className="text-sm text-destructive" aria-live="polite">
              {form.formState.errors.root.serverError.message}
            </p>
          )}
          <Button disabled={form.formState.isSubmitting} type="submit" data-testid="contact-submit-btn">
            {form.formState.isSubmitting ? (
              <span className="flex items-center animate-pulse">
                {c("savingData")}
              </span>
            ) : (
              t("createButton")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
