import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const certDir = path.resolve(__dirname, ".cert");
const pfxPath = path.join(certDir, "dev-server.pfx");
const passphrasePath = path.join(certDir, "dev-server.passphrase");

const httpsConfig =
  fs.existsSync(pfxPath) && fs.existsSync(passphrasePath)
    ? {
        pfx: fs.readFileSync(pfxPath),
        passphrase: fs.readFileSync(passphrasePath, "utf8").trim()
      }
    : undefined;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const rawApiBaseUrl = env.VITE_API_BASE_URL?.trim();

  let proxyTarget = "http://localhost:8080";
  if (rawApiBaseUrl?.startsWith("http://") || rawApiBaseUrl?.startsWith("https://")) {
    proxyTarget = new URL(rawApiBaseUrl).origin;
  }

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      https: httpsConfig,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      https: httpsConfig
    }
  };
});
