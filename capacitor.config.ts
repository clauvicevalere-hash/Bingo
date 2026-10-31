import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bingo.shop",
  appName: "Bingo",
  webDir: "capacitor-shell",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://votre-domaine.com",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
