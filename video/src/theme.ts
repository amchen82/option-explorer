import { loadFont } from "@remotion/google-fonts/Outfit";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const colors = {
  bg: "#0c111d",
  surface: "#101828",
  surface2: "#1d2939",
  border: "#1d2939",
  textPrimary: "#ffffff",
  textSecondary: "#98a2b3",
  textTertiary: "#667085",
  accent: "#465fff",
  accentSoft: "rgba(70, 95, 255, 0.16)",
};

export const FPS = 30;
