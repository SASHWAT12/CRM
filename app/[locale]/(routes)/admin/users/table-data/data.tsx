import { StopIcon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";

export const statuses = [
  {
    value: "ACTIVE",
    label: "Active",
    icon: PlayIcon,
  },
  {
    value: "INACTIVE",
    label: "Inactive",
    icon: StopIcon,
  },
  {
    value: "PENDING",
    label: "Pending",
    icon: PauseIcon,
  },
];
export const roles = [
  {
    value: "admin",
    label: "Admin",
    icon: PlayIcon,
  },
  {
    value: "doctor",
    label: "Doctor",
    icon: PlayIcon,
  },
  {
    value: "counsellor",
    label: "Counsellor",
    icon: PlayIcon,
  },
  {
    value: "manager",
    label: "Manager",
    icon: PauseIcon,
  },
  {
    value: "receptionist",
    label: "Receptionist",
    icon: PauseIcon,
  },
  {
    value: "user",
    label: "User",
    icon: StopIcon,
  },
];
