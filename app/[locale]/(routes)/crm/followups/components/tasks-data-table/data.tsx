import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
} from "lucide-react";

export const statuses = [
  {
    value: "ACTIVE",
    label: "Active",
    icon: ArrowRightIcon,
  },
  {
    value: "PENDING",
    label: "Pending",
    icon: HelpCircleIcon,
  },
  {
    value: "COMPLETE",
    label: "Complete",
    icon: CheckCircle2Icon,
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
  },
  {
    label: "Critical",
    value: "critical",
    icon: ArrowUpIcon,
  },
];
