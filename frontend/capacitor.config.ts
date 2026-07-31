import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.optionsiq.ideas",
  appName: "Options Ideas",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0e11",
    },
    Keyboard: {
      resize: "native",
    },
  },
};

export default config;
