import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || "/";
const projectDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: basePath,

  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),

    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(projectDir, ".."),
            }),
          ),

          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(projectDir, "src"),

      "@assets": path.resolve(
        projectDir,
        "..",
        "..",
        "attached_assets",
      ),
    },

    dedupe: ["react", "react-dom"],
  },

  root: path.resolve(projectDir),

  build: {
    outDir: path.resolve(projectDir, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (!normalizedId.includes("/node_modules/")) return undefined;
          if (normalizedId.includes("/node_modules/@supabase/")) return "vendor-supabase";
          if (normalizedId.includes("/node_modules/framer-motion/")) return "vendor-motion";
          if (normalizedId.includes("/node_modules/@radix-ui/")) return "vendor-radix";
          if (normalizedId.includes("/node_modules/lucide-react/")) return "vendor-icons";
          if (normalizedId.includes("/node_modules/zod/")) return "vendor-zod";
          if (normalizedId.includes("/node_modules/@tanstack/react-query/")) return "vendor-query";
          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/wouter/")
          ) {
            return "vendor-react";
          }
          return undefined;
        },
      },
    },
  },

  server: {
    port,
    host: "0.0.0.0",

    allowedHosts: true,

    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },

  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
