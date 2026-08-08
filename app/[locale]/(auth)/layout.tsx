import React from "react";
import "@/app/[locale]/globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-background text-foreground p-4">
      {/* Top right floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Centered Auth Card Container */}
      <main className="w-full max-w-md flex flex-col items-center justify-center my-auto">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
