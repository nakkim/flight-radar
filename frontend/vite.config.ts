import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vite.dev/config/
export default defineVitestConfig({
  plugins: [react(), svgr()],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
