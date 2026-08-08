"use client";

import React, { useState } from "react";
import { createBrowserClientHelper } from "@/lib/supabase/client";
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
import { MailIcon } from "lucide-react";

export function ForgotPasswordComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClientHelper();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );

      if (error) {
        toast.error(error.message || "Failed to send password reset email.");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success("Password reset link sent! Check your inbox.");
    } catch (err: any) {
      console.error("[ForgotPassword Error]", err);
      toast.error("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border border-border/50">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Forgot Password
        </CardTitle>
        <CardDescription>
          {submitted
            ? "We've sent a password reset link to your email address."
            : "Enter your registered email address to receive a password reset link"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please check your email inbox and click the reset link to choose a new password.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSubmitted(false)}
            >
              Resend Link
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              <a href="/sign-in" className="text-primary font-medium hover:underline">
                Return to Sign In
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </Button>

            <div className="text-center text-xs text-muted-foreground mt-2">
              Remember your password?{" "}
              <a href="/sign-in" className="text-primary font-medium hover:underline">
                Sign In
              </a>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
