import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

// Static, prerendered build in dist/client. Set PAGES_BASE (e.g. "/hrithik-himaja/")
// when the site is served from a GitHub Pages repository sub-path; defaults to "/".
const base = process.env["PAGES_BASE"] || "/";

export default defineConfig({
  base,
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  server: { host: "::", port: 8080 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // src/server.ts is the SSR error wrapper used while prerendering
      server: { entry: "server" },
      router: { basepath: base },
      prerender: { enabled: true, crawlLinks: true, failOnError: true },
    }),
    viteReact(),
  ],
});
