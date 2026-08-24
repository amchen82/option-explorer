import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { colors, fontFamily } from "../theme";

const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

type Rect = { x: number; y: number; width: number; height: number };

type Stop = {
  rect: Rect;
  label: string;
  description: string;
};

type Props = {
  src: string;
  imageWidth: number;
  imageHeight: number;
  kicker: string;
  stops: Stop[];
  holdFrames: number;
  transitionFrames: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// The source image (a narrow, tall UI panel) is scaled so its width fills the
// frame — matching how the other Ken Burns scenes treat images that are
// already frame-sized. Every rect and origin below is expressed in this
// "displayed" pixel space (natural pixels * BASE_SCALE), not natural pixels.
function buildTimeline(stops: Stop[], imageWidth: number, imageHeight: number, hold: number, trans: number) {
  const baseScale = FRAME_WIDTH / imageWidth;
  const displayedHeight = imageHeight * baseScale;

  const frames: number[] = [];
  const tx: number[] = [];
  const ty: number[] = [];
  const zoom: number[] = [];
  const rectX: number[] = [];
  const rectY: number[] = [];
  const rectW: number[] = [];
  const rectH: number[] = [];
  const stopStartFrame: number[] = [];

  let t = 0;

  stops.forEach((stop, i) => {
    const rx = stop.rect.x * baseScale;
    const ry = stop.rect.y * baseScale;
    const rw = stop.rect.width * baseScale;
    const rh = stop.rect.height * baseScale;

    // Zoom to fill most of the frame with this rect, then pan (translate) so
    // the rect's center lands at the frame's center. Panning is computed
    // explicitly instead of via transform-origin, because transform-origin
    // only produces a visible pan when the zoom is well above 1 — here most
    // rects are already close to the frame's width, so the zoom alone is too
    // small to reach targets deep down a very tall image.
    const zm = clamp(Math.min((FRAME_WIDTH * 0.88) / rw, (FRAME_HEIGHT * 0.8) / rh), 1, 1.6);
    const centerX = rx + rw / 2;
    const centerY = ry + rh / 2;
    const panX = FRAME_WIDTH / 2 - zm * centerX;
    const panY = FRAME_HEIGHT / 2 - zm * centerY;

    stopStartFrame.push(t);

    frames.push(t);
    tx.push(panX);
    ty.push(panY);
    zoom.push(zm);
    rectX.push(rx);
    rectY.push(ry);
    rectW.push(rw);
    rectH.push(rh);

    t += hold;

    frames.push(t);
    tx.push(panX);
    ty.push(panY);
    zoom.push(zm);
    rectX.push(rx);
    rectY.push(ry);
    rectW.push(rw);
    rectH.push(rh);

    if (i < stops.length - 1) {
      t += trans;
    }
  });

  return {
    frames,
    tx,
    ty,
    zoom,
    rectX,
    rectY,
    rectW,
    rectH,
    totalFrames: t,
    stopStartFrame,
    baseScale,
    displayedHeight,
  };
}

export const ScrollDetailScene: React.FC<Props> = ({
  src,
  imageWidth,
  imageHeight,
  kicker,
  stops,
  holdFrames,
  transitionFrames,
}) => {
  const frame = useCurrentFrame();

  const timeline = buildTimeline(stops, imageWidth, imageHeight, holdFrames, transitionFrames);

  const easing = Easing.bezier(0.45, 0, 0.55, 1);
  const opts = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing };

  const tx = interpolate(frame, timeline.frames, timeline.tx, opts);
  const ty = interpolate(frame, timeline.frames, timeline.ty, opts);
  const zoom = interpolate(frame, timeline.frames, timeline.zoom, opts);
  const rectX = interpolate(frame, timeline.frames, timeline.rectX, opts);
  const rectY = interpolate(frame, timeline.frames, timeline.rectY, opts);
  const rectW = interpolate(frame, timeline.frames, timeline.rectW, opts);
  const rectH = interpolate(frame, timeline.frames, timeline.rectH, opts);

  const highlightIn = interpolate(frame, [10, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: FRAME_WIDTH,
            height: timeline.displayedHeight,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: rectX,
            top: rectY,
            width: rectW,
            height: rectH,
            borderRadius: 14,
            border: `3px solid ${colors.accent}`,
            boxShadow: `0 0 0 2000px rgba(12,17,29,0.55), 0 0 32px ${colors.accent}`,
            opacity: highlightIn,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          padding: "56px 88px",
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
            textShadow: "0 2px 12px rgba(12,17,29,0.9)",
          }}
        >
          {kicker}
        </span>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 88px 78px" }}>
        {stops.map((stop, i) => {
          const startFrame = timeline.stopStartFrame[i];
          const holdEnd = startFrame + holdFrames;
          const fadeIn = interpolate(frame, [startFrame - transitionFrames * 0.6, startFrame], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          const fadeOut = interpolate(frame, [holdEnd, holdEnd + transitionFrames * 0.6], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          });
          const opacity = Math.min(fadeIn, fadeOut);

          if (opacity <= 0.001) {
            return null;
          }

          return (
            <div
              key={stop.label}
              style={{
                position: "absolute",
                left: 88,
                right: 88,
                bottom: 78,
                opacity,
                background:
                  "linear-gradient(to top, rgba(12,17,29,0.92) 0%, rgba(12,17,29,0.55) 55%, rgba(12,17,29,0) 100%)",
                padding: "40px 0 0",
              }}
            >
              <h2
                style={{
                  fontFamily,
                  fontSize: 50,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: 0,
                  maxWidth: 1100,
                }}
              >
                {stop.label}
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
                {stop.description}
              </p>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function scrollDetailDuration(stopCount: number, holdFrames: number, transitionFrames: number) {
  return stopCount * holdFrames + (stopCount - 1) * transitionFrames;
}
