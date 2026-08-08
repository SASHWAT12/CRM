"use client";

import React, { useState } from "react";
import { createBrowserClientHelper } from "@/lib/supabase/client";
import { checkUserRegistration } from "@/actions/auth/check-user-registration";
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
import { LockIcon, MailIcon } from "lucide-react";

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserClientHelper();

      // First check if the user is registered in the CRM database
      const regCheck = await checkUserRegistration(email);
      if (regCheck.error) {
        toast.error(regCheck.error);
        setIsLoading(false);
        return;
      }

      if (!regCheck.registered) {
        toast.error("Access Denied: Your email is not registered in this CRM. Please contact your administrator.");
        setIsLoading(false);
        return;
      }

      // Proceed with Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      toast.success("Login successful.");
      window.location.href = "/";
    } catch (err: any) {
      toast.error("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border border-border/50">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Welcome to {process.env.NEXT_PUBLIC_APP_NAME || "Hospital CRM"}
        </CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
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

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot Password?
              </a>
            </div>
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

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-xs text-muted-foreground mt-2">
            Don't have an account?{" "}
            <a href="/register" className="text-primary font-medium hover:underline">
              Register
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
