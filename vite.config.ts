import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        r3Probe: "r3-probe.html",
        r3MixedPressureProbe:
          "r3-mixed-pressure-probe.html",
      },
    },
  },
});
