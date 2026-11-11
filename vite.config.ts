import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";

// The Midnight SDK ships WebAssembly and expects a few Node globals; the
// aliases below mirror the setup of Midnight's reference browser dApp.
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/examples/tokenized-data/",
  define: {
    global: "globalThis",
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    wasm(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      process: "process/browser",
      buffer: "buffer",
      util: "util",
      crypto: path.resolve(__dirname, "src/lib/crypto-shim.ts"),
      stream: "stream-browserify",
      events: "events",
    },
  },
  optimizeDeps: {
    include: ["level", "browser-level", "abstract-level", "level-supports", "level-transcoder"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
  },
  worker: {
    format: "es" as const,
  },
}));
