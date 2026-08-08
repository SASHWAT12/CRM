"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  avatar?: string | null;
  name: string | null;
};

export function ProfileHeroAvatar({ name }: Props) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <Avatar className="h-16 w-16 rounded-full border-2 border-white/50 flex-shrink-0">
      <AvatarFallback className="bg-white/25 text-white text-xl font-bold rounded-full">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
