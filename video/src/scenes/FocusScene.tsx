import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  src: string;
  focusRect: Rect;
  kicker: string;
  title: string;
  description: string;
  highlight?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const FocusScene: React.FC<Props> = ({ src, focusRect, kicker, title, description, highlight = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const originXEnd = ((focusRect.x + focusRect.width / 2) / FRAME_WIDTH) * 100;
  const originYEnd = ((focusRect.y + focusRect.height / 2) / FRAME_HEIGHT) * 100;
  const targetScale = clamp(
    Math.min((FRAME_WIDTH * 0.9) / focusRect.width, (FRAME_HEIGHT * 0.9) / focusRect.height),
    1.15,
    2.4,
  );

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const originX = interpolate(progress, [0, 1], [50, originXEnd]);
  const originY = interpolate(progress, [0, 1], [50, originYEnd]);
  const scale = interpolate(progress, [0, 1], [1, targetScale]);

  const textIn = interpolate(frame, [8, 28], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const highlightIn = interpolate(frame, [16, 34], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${originX}% ${originY}%`,
          transform: `scale(${scale})`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
          }}
        />

        {highlight && (
          <div
            style={{
              position: "absolute",
              left: focusRect.x,
              top: focusRect.y,
              width: focusRect.width,
              height: focusRect.height,
              borderRadius: 16,
              border: `3px solid ${colors.accent}`,
              boxShadow: `0 0 0 2000px rgba(12,17,29,0.55), 0 0 32px ${colors.accent}`,
              opacity: highlightIn,
            }}
          />
        )}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: "0 88px 78px",
          background: "linear-gradient(to top, rgba(12,17,29,0.92) 0%, rgba(12,17,29,0.55) 32%, rgba(12,17,29,0) 60%)",
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
            fontSize: 54,
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
            fontSize: 26,
            fontWeight: 400,
            color: colors.textSecondary,
            margin: "12px 0 0",
            maxWidth: 900,
          }}
        >
          {description}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
