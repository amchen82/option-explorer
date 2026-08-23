import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

type Props = {
  src: string;
  kicker: string;
  title: string;
  description: string;
  panDirection?: "left" | "right";
};

export const ScreenshotScene: React.FC<Props> = ({ src, kicker, title, description, panDirection = "right" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panPx = panDirection === "right" ? [0, -26] : [0, 26];
  const translateX = interpolate(frame, [0, durationInFrames], panPx, {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textIn = interpolate(frame, [10, 32], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translateX(${translateX}px)`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(12,17,29,0.92) 0%, rgba(12,17,29,0.55) 32%, rgba(12,17,29,0) 60%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 88px 84px",
          opacity: textIn,
          transform: `translateY(${interpolate(textIn, [0, 1], [24, 0])}px)`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: colors.accent,
          }}
        >
          {kicker}
        </span>
        <h2
          style={{
            fontFamily,
            fontSize: 56,
            fontWeight: 700,
            color: colors.textPrimary,
            margin: "10px 0 0",
            maxWidth: 1100,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily,
            fontSize: 28,
            fontWeight: 400,
            color: colors.textSecondary,
            margin: "14px 0 0",
            maxWidth: 1000,
          }}
        >
          {description}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
