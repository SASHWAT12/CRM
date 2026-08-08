"use client";

import React, { useState } from "react";
import { Check, ChevronRight, AlertCircle, Sparkles, Undo } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePatientStage } from "@/actions/crm/patients/update-patient-stage";
import { cn } from "@/lib/utils";

interface PatientPipelineTrackerProps {
  patientId: string;
  currentStage: string;
  lossReason?: string | null;
}

const STAGES = [
  { key: "NEW", label: "New Inquiry" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "INTERESTED", label: "Interested" },
  { key: "CONSULTATION_BOOKED", label: "Consultation Booked" },
  { key: "VISITED", label: "Visited" },
  { key: "TREATMENT_STARTED", label: "Treatment Started" },
  { key: "CONVERTED", label: "Converted" },
];

export function PatientPipelineTracker({
  patientId,
  currentStage,
  lossReason,
}: PatientPipelineTrackerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLossInput, setShowLossInput] = useState(false);
  const [localLossReason, setLocalLossReason] = useState("");
  const [pendingNextStage, setPendingNextStage] = useState<string | null>(null);

  const currentStageIndex = STAGES.findIndex((s) => s.key === currentStage);
  const isLost = currentStage === "CLOSED_LOST";
  const isConverted = currentStage === "CONVERTED";

  const handleStageChange = async (nextStage: string, reason?: string) => {
    setIsLoading(true);
    try {
      const result = await updatePatientStage({
        patientId,
        expectedCurrentStage: currentStage,
        nextStage,
        lossReason: reason,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Patient stage updated to: ${nextStage}`);
        setShowLossInput(false);
        setLocalLossReason("");
        setPendingNextStage(null);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update stage");
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectStage = (val: string) => {
    if (val === "CLOSED_LOST") {
      setPendingNextStage("CLOSED_LOST");
      setShowLossInput(true);
    } else {
      setShowLossInput(false);
      handleStageChange(val);
    }
  };

  const handleAdvance = () => {
    if (isLost) return;
    const nextIndex = currentStageIndex + 1;
    if (nextIndex < STAGES.length) {
      const nextStage = STAGES[nextIndex].key;
      handleStageChange(nextStage);
    }
  };

  const handleRecover = () => {
    handleStageChange("NEW");
  };

  const submitLossReason = () => {
    if (!localLossReason.trim()) {
      toast.error("Please enter a reason for closing this inquiry");
      return;
    }
    handleStageChange("CLOSED_LOST", localLossReason);
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Patient Conversion Journey
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold">
              {isLost ? "Closed Lost" : STAGES[currentStageIndex]?.label || currentStage}
            </span>
            {isLost && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                Reason: {lossReason || "N/A"}
              </span>
            )}
            {isConverted && (
              <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Converted
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {isLost ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRecover}
              disabled={isLoading}
            >
              <Undo className="h-4 w-4" />
              <span>Recover Inquiry</span>
            </Button>
          ) : (
            <>
              <Select
                value={isLost ? "CLOSED_LOST" : currentStage}
                onValueChange={onSelectStage}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Update Stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="CLOSED_LOST" className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    Closed Lost
                  </SelectItem>
                </SelectContent>
              </Select>

              {currentStageIndex < STAGES.length - 1 && (
                <Button
                  size="sm"
                  className="h-9 gap-1"
                  onClick={handleAdvance}
                  disabled={isLoading}
                >
                  <span>Advance Stage</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {showLossInput && (
        <div className="p-3 border border-destructive/20 rounded-lg bg-destructive/5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="text-sm font-semibold text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            <span>Specify Loss Reason</span>
          </div>
          <Textarea
            placeholder="e.g. Chose competitor, treatment budget constraints, out of state..."
            value={localLossReason}
            onChange={(e) => setLocalLossReason(e.target.value)}
            className="bg-background"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowLossInput(false);
                setPendingNextStage(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={submitLossReason}
              disabled={isLoading}
            >
              Confirm Close Lost
            </Button>
          </div>
        </div>
      )}

      {/* Horizontal Steps flow */}
      {!isLost && (
        <div className="hidden lg:flex items-center w-full justify-between px-2 pt-2 overflow-x-auto">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;

            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center text-center gap-1.5 relative group min-w-[90px]">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 shadow-sm",
                      isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                      isActive && "bg-gradient-to-br from-primary to-indigo-600 border-primary text-white scale-110 ring-4 ring-primary/20",
                      !isCompleted && !isActive && "bg-muted/30 border-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium max-w-[90px] leading-tight select-none transition-colors",
                      isActive && "text-foreground font-semibold",
                      !isActive && "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </span>
                </div>

                {idx < STAGES.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-[2px] mx-1 transition-all duration-500",
                      idx < currentStageIndex
                        ? "bg-emerald-500"
                        : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
