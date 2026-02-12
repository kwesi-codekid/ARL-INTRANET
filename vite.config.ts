import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    // recharts is client-only (loaded via dynamic import in useEffect);
    // keep it external during SSR to avoid bundling browser-dependent code
    noExternal: [],
    external: ["recharts"],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about dynamic imports not moving modules into separate chunks
        // This happens when server modules are imported both dynamically and statically
        if (
          warning.code === "PLUGIN_WARNING" &&
          warning.message?.includes("dynamic import will not move module into another chunk")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
