import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        e0AuthoritativeBody: "probes/e0-authoritative-body.html",
        e01IndependentMechanicalProcess: "probes/e01-independent-mechanical-process.html",
        e02aPassageComposition: "probes/e02a-passage-composition.html",
      },
    },
  },
});
