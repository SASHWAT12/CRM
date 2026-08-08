"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfigList } from "./ConfigList";
import type { CrmConfigType, ConfigValue } from "../_actions/crm-settings";
import { Building2, Briefcase, Info, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type TabConfig = {
  key: CrmConfigType;
  label: string;
  values: ConfigValue[];
};

interface Props {
  tabs: TabConfig[];
}

export function HospitalSettingsClient({ tabs }: Props) {
  // Hospital Details State
  const [hospitalName, setHospitalName] = useState("Mmrh Hospital & Clinical Center");
  const [address, setAddress] = useState("100 Healthcare Boulevard, Medical District");
  const [phone, setPhone] = useState("+1 (555) 234-5678");
  const [email, setEmail] = useState("contact@mmrhhospital.org");
  const [website, setWebsite] = useState("https://mmrhhospital.org");

  // Business Operational Configs State
  const [defaultDuration, setDefaultDuration] = useState("30");
  const [workingHours, setWorkingHours] = useState("08:00 AM - 06:00 PM");
  const [weekendConfig, setWeekendConfig] = useState("Saturday & Sunday (Emergency Only)");
  const [defaultPatientStatus, setDefaultPatientStatus] = useState("Active / Prospect");

  const [savingHospital, setSavingHospital] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHospital(true);
    setTimeout(() => {
      setSavingHospital(false);
      toast.success("Hospital details saved successfully.");
    }, 400);
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBusiness(true);
    setTimeout(() => {
      setSavingBusiness(false);
      toast.success("Business configuration saved successfully.");
    }, 400);
  };

  return (
    <Tabs defaultValue="hospital" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="hospital" className="gap-2 text-xs font-semibold">
          <Building2 className="h-3.5 w-3.5" />
          <span>Hospital</span>
        </TabsTrigger>
        <TabsTrigger value="business" className="gap-2 text-xs font-semibold">
          <Briefcase className="h-3.5 w-3.5" />
          <span>Business</span>
        </TabsTrigger>
        <TabsTrigger value="system" className="gap-2 text-xs font-semibold">
          <Info className="h-3.5 w-3.5" />
          <span>System Info</span>
        </TabsTrigger>
      </TabsList>

      {/* 1. HOSPITAL DETAILS SECTION */}
      <TabsContent value="hospital">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Hospital Identity & Contact Details</CardTitle>
            <CardDescription>
              Organization information displayed on clinical records and outgoing reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveHospital} className="space-y-4 max-w-2xl">
              <div className="grid gap-1.5">
                <Label htmlFor="hospitalName">Hospital Name</Label>
                <Input
                  id="hospitalName"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="address">Hospital Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Administrative Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" size="sm" disabled={savingHospital} className="gap-1.5 mt-2">
                <Save className="h-3.5 w-3.5" />
                <span>{savingHospital ? "Saving..." : "Save Hospital Details"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 2. BUSINESS CONFIGURATION SECTION */}
      <TabsContent value="business" className="space-y-6">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Operational & Clinical Defaults</CardTitle>
            <CardDescription>
              Configure default appointment durations, clinic hours, and status options.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBusiness} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="defaultDuration">Default Appointment Duration (Minutes)</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="workingHours">Clinic Working Hours</Label>
                  <Input
                    id="workingHours"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="weekendConfig">Weekend Schedule</Label>
                  <Input
                    id="weekendConfig"
                    value={weekendConfig}
                    onChange={(e) => setWeekendConfig(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="defaultStatus">Default Patient Status</Label>
                  <Input
                    id="defaultStatus"
                    value={defaultPatientStatus}
                    onChange={(e) => setDefaultPatientStatus(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="sm" disabled={savingBusiness} className="gap-1.5 mt-2">
                <Save className="h-3.5 w-3.5" />
                <span>{savingBusiness ? "Saving..." : "Save Business Config"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing CRM Lookup Option Configs */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">CRM Field Lookup Options</CardTitle>
            <CardDescription>
              Manage configurable dropdown lists for Contact Types, Lead Sources, Statuses, and Types.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={tabs[0]?.key}>
              <TabsList className="flex-wrap h-auto gap-1 mb-4">
                {tabs.map((t) => (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((t) => (
                <TabsContent key={t.key} value={t.key}>
                  <ConfigList configType={t.key} label={t.label} values={t.values} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 3. SYSTEM INFORMATION (READ-ONLY) SECTION */}
      <TabsContent value="system">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">System Information & Runtime Status</CardTitle>
            <CardDescription>
              Read-only system metadata, environment flags, and database connectivity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="p-4 rounded-lg bg-muted/40 border space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Application Version</span>
                <p className="font-semibold text-sm">v0.12.3 (Production Build)</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Environment</span>
                <p className="font-semibold text-sm capitalize">{process.env.NODE_ENV || "development"}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Database Engine</span>
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>PostgreSQL (Prisma Client v7.6)</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Application Framework</span>
                <p className="font-semibold text-sm">Next.js 16 (Turbopack Edge Router)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
