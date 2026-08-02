import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new globalThis.URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(projectDir, "src"),
      "@assets": path.resolve(projectDir, "..", "..", "attached_assets"),
    },
  },
  test: {
    environment: "node",
    globals: false,
  },
});
