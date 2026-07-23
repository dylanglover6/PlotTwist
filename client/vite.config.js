import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Server runs on 5050 in dev (macOS AirPlay Receiver occupies 5000).
      "/api": "http://localhost:5050"
    }
  }
});
