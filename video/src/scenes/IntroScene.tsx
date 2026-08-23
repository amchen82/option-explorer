import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../theme";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const logoIn = interpolate(frame, [0, 24], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleIn = interpolate(frame, [14, 40], [0, 1], {
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
      }}
    >
      <div
        style={{
          opacity: logoIn,
          transform: `translateY(${interpolate(logoIn, [0, 1], [16, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="16" height="16" rx="3" stroke={colors.accent} strokeWidth="1.4" />
          <polyline
            points="3.5,13 6.5,8.5 9.5,11 12,7.5 14.5,5"
            stroke={colors.accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontFamily,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 6,
            color: colors.textPrimary,
          }}
        >
          OPTION IDEAS
        </span>
      </div>

      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [16, 0])}px)`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily,
            fontSize: 58,
            fontWeight: 700,
            color: colors.textPrimary,
            margin: 0,
            maxWidth: 1100,
          }}
        >
          Understand an options trade before you make one
        </h1>
      </div>
    </AbsoluteFill>
  );
};
