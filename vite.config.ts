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
        e02bRobustness: "probes/e02b-robustness.html",
        b01bB0ScalePassage: "probes/b01b-b0-scale-passage.html",
        b01cActualB0Effectivity: "probes/b01c-actual-b0-effectivity.html",
      },
    },
  },
});
