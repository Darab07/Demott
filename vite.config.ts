import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standalone demo: builds to ./dist as plain static files (relative base so it
// can be served from any path or opened as a leave-behind).
export default defineConfig({
  plugins: [react()],
  base: "./",
  // allowedHosts: temporary tunnel addresses for testing on a phone.
  server: { host: true, port: 5173, allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".trycloudflare.com"] },
});
