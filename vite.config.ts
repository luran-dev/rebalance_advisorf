import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { appServerPlugin } from "./appServer";
import { marketServerPlugin } from "./marketServer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      appServerPlugin({ resendApiKey: env["RESEND_API_KEY"], resendFromEmail: env["RESEND_FROM_EMAIL"] }),
      marketServerPlugin(),
    ],
  };
});
