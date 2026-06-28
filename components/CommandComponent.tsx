"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  LogOut,
  Settings,
  Smile,
  User,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandComponent() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("CommandComponent");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && e.metaKey) {
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
      if (e.key === "D" && e.metaKey && e.shiftKey) {
        router.push("/");
        setOpen(false);
      }
      if (e.key === "P" && e.metaKey && e.shiftKey) {
        router.push("/profile");
        setOpen(false);
      }
      if (e.key === "k" && e.metaKey) {
        signOut().then(() => { window.location.href = "/sign-in"; });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]);

  return (
    <div className="hidden lg:block">
      <p className="text-sm text-muted-foreground">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={t("placeholder")}
        />
        <CommandList>
          <CommandEmpty>{t("noResults")}</CommandEmpty>
          <CommandSeparator />
          <CommandGroup heading={t("settings")}>
            <CommandItem onClick={() => redirect("/")}>
              <User className="mr-2 h-4 w-4" />
              <span>{t("dashboard")}</span>
              <CommandShortcut>Shift + ⌘ + D</CommandShortcut>
            </CommandItem>
            <CommandItem onClick={() => redirect("/profile")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("profileSettings")}</span>
              <CommandShortcut>Shift + ⌘ + P</CommandShortcut>
            </CommandItem>
            <CommandItem onClick={async () => { await signOut(); window.location.href = "/sign-in"; }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("logout")}</span>
              <CommandShortcut>⌘k</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
