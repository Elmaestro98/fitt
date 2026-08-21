"use client";

import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/shadcn/switch";

export function ThemeToggleAdmin({
  theme,
  onChange,
}: {
  theme: "dark" | "light";
  onChange: (clair: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <Sun className="size-3.5 text-admin-muted" aria-hidden="true" />
      <Switch
        checked={theme === "light"}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-admin-accent data-[state=unchecked]:bg-admin-line"
        aria-label={
          theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"
        }
      />
      <Moon className="size-3.5 text-admin-muted" aria-hidden="true" />
    </label>
  );
}
