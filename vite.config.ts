import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        r2: "r2.html",
        r2Live: "r2-live.html",
      },
    },
  },
});
