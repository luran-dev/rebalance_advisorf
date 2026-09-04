import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { marketServerPlugin } from "./marketServer";

export default defineConfig({
  plugins: [react(), marketServerPlugin()],
});
