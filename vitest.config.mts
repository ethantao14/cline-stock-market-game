import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // Disable Node 25's built-in localStorage so jsdom's is used.
    // This flag is also accepted by Node 24.
    execArgv: ["--no-experimental-webstorage"],
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});
