"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THEME_PRESETS, type Theme } from "@/lib/theme";

const APPEARANCE_THEMES: Theme[] = ["light", "dark"];
const COLOR_THEMES: Theme[] = [
  "forest",
  "ocean",
  "aurora",
  "midnight",
  "slate",
  "indigo",
  "violet",
  "berry",
  "sunset",
  "gold",
  "crimson",
  "neon",
];

function isKnownTheme(value: string | undefined): value is Theme {
  return value !== undefined && value in THEME_PRESETS;
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeTheme = isKnownTheme(theme) ? theme : ("light" as Theme);

  return (
    <div className="relative inline-block">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Change color theme"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Palette className="size-4" />
      </Button>

      {open && (
        <div
          ref={panelRef}
          className="absolute top-12 right-0 z-50 w-60 divide-y divide-border rounded-xl border bg-popover p-3 shadow-lg shadow-black/20"
          role="dialog"
          aria-modal="false"
        >
          <ThemeSwatchGroup
            title="Appearance"
            themes={APPEARANCE_THEMES}
            activeTheme={activeTheme}
            onSelect={(next) => {
              setTheme(next);
              setOpen(false);
            }}
          />
          <ThemeSwatchGroup
            title="Color"
            themes={COLOR_THEMES}
            activeTheme={activeTheme}
            onSelect={(next) => {
              setTheme(next);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ThemeSwatchGroupProps {
  title: string;
  themes: Theme[];
  activeTheme: Theme;
  onSelect: (theme: Theme) => void;
}

function ThemeSwatchGroup({ title, themes, activeTheme, onSelect }: ThemeSwatchGroupProps) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <p className="px-2 pb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => {
          const preset = THEME_PRESETS[theme];
          const selected = activeTheme === theme;
          return (
            <button
              key={theme}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(theme)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                selected
                  ? "border-primary bg-secondary/50 text-foreground"
                  : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className={cn("h-5 w-5 shrink-0 rounded", preset.swatch)} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
