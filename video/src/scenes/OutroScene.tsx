import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../theme";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const in1 = interpolate(frame, [0, 22], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const in2 = interpolate(frame, [14, 36], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const in3 = interpolate(frame, [28, 50], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontFamily,
          fontSize: 54,
          fontWeight: 700,
          color: colors.textPrimary,
          margin: 0,
          opacity: in1,
          transform: `translateY(${interpolate(in1, [0, 1], [16, 0])}px)`,
        }}
      >
        Free. No sign-in required.
      </h2>
      <p
        style={{
          fontFamily,
          fontSize: 28,
          fontWeight: 400,
          color: colors.textSecondary,
          margin: "18px 0 0",
          maxWidth: 900,
          opacity: in2,
          transform: `translateY(${interpolate(in2, [0, 1], [16, 0])}px)`,
        }}
      >
        Pick any liquid stock or ETF and see the strategy ideas Option Ideas would consider.
      </p>
      <div
        style={{
          marginTop: 44,
          padding: "18px 40px",
          borderRadius: 12,
          border: `1.5px solid ${colors.accent}`,
          backgroundColor: colors.accentSoft,
          opacity: in3,
          transform: `translateY(${interpolate(in3, [0, 1], [16, 0])}px)`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize: 30,
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          option-ideas.com
        </span>
      </div>
    </AbsoluteFill>
  );
};
