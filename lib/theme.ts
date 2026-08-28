// The selectable color themes. Adding a new theme here means adding its CSS
// variables in app/globals.css (a matching .<theme> block) and nothing else.
export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "light";
