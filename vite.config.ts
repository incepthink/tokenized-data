import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";

// On Vercel the build process finishes writing dist/ but never exits (a handle
// left open by the WebAssembly toolchain keeps Node alive), so the deployment
// hangs in BUILDING. Exit explicitly once the bundle is closed.
const exitAfterBuild = () => ({
  name: "exit-after-build",
  apply: "build" as const,
  closeBundle() {
    if (process.env.VERCEL) setTimeout(() => process.exit(0), 1000);
  },
});

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
    exitAfterBuild(),
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
