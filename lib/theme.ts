// The selectable color themes. Each theme is a class applied to <html> via
// next-themes; define its variables as a matching .<theme> block in
// app/globals.css (plus --page-bg there). light/dark are already defined, and
// forest/sunset/berry/indigo add accent moods on top of the dark token base.
export const THEMES = ["light", "dark", "forest", "sunset", "berry", "indigo"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "light";

// Human-facing labels + the decorative swatch color shown in the theme picker.
// The accent swatch colors mirror each theme's --primary so the picker previews
// what the active theme will look like.
export const THEME_PRESETS: Record<Theme, { label: string; swatch: string }> = {
  light: { label: "Light", swatch: "bg-gradient-to-r from-slate-200 via-slate-100 to-white" },
  dark: { label: "Dark", swatch: "bg-slate-900" },
  forest: { label: "Forest", swatch: "bg-emerald-500" },
  sunset: { label: "Sunset", swatch: "bg-amber-500" },
  berry: { label: "Berry", swatch: "bg-pink-500" },
  indigo: { label: "Indigo", swatch: "bg-indigo-500" },
};
