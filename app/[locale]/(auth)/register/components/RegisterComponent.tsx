"use client";

import React, { useState } from "react";
import { createBrowserClientHelper } from "@/lib/supabase/client";
import { checkEmailAvailability, createCrmUserRecord } from "@/actions/auth/register-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2Icon, LockIcon, MailIcon, UserIcon } from "lucide-react";

export function RegisterComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Check duplicate email in CRM Users database
      const availability = await checkEmailAvailability(email);
      if (!availability.available) {
        toast.error(availability.error || "An account with this email already exists.");
        setIsLoading(false);
        return;
      }

      // Step 2: Create Supabase Auth user
      const supabase = createBrowserClientHelper();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (signUpError || !data.user) {
        toast.error(signUpError?.message || "Failed to create authentication account.");
        setIsLoading(false);
        return;
      }

      // Step 3: Create CRM Users database record linked to supabase_id
      const crmRecord = await createCrmUserRecord({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        supabase_id: data.user.id,
      });

      if (!crmRecord.success) {
        toast.error(crmRecord.error || "Failed to finalize CRM user profile.");
        setIsLoading(false);
        return;
      }

      // Step 4: Show verification instructions state
      setRegisteredEmail(email.trim().toLowerCase());
      setIsSuccess(true);
      toast.success("Account created! Please check your email for verification.");
    } catch (err: any) {
      console.error("[Register Error]", err);
      toast.error("An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md shadow-lg border border-border/50">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle2Icon className="h-12 w-12 text-green-500 animate-in zoom-in-50 duration-300" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Verification Required
          </CardTitle>
          <CardDescription className="text-sm font-medium text-foreground">
            Your account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2 border border-border/40">
            <p className="text-muted-foreground">
              A verification email has been sent to{" "}
              <span className="font-semibold text-foreground">{registeredEmail}</span>.
            </p>
            <p className="font-medium text-foreground">
              Please verify your email before signing in.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            If you do not receive the email within a few minutes, check your{" "}
            <span className="font-medium text-foreground">Spam/Junk</span> folder.
          </p>

          <Button
            className="w-full mt-2"
            onClick={() => (window.location.href = "/sign-in")}
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border border-border/50">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create an Account
        </CardTitle>
        <CardDescription>
          Enter your details below to register for CRM access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Dr. Alex Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="alex.smith@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="pl-9"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Register"}
          </Button>

          <div className="text-center text-xs text-muted-foreground mt-2">
            Already have an account?{" "}
            <a href="/sign-in" className="text-primary font-medium hover:underline">
              Sign In
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
