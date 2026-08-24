import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Composition } from "remotion";
import { FocusScene } from "./scenes/FocusScene";
import { IntroScene } from "./scenes/IntroScene";
import { ScrollDetailScene, scrollDetailDuration } from "./scenes/ScrollDetailScene";
import { colors } from "./theme";

const FPS = 30;
const INTRO_DURATION = 2 * FPS;
const SCENE_DURATION = 5 * FPS;
const TRANSITION_DURATION = 12;

const DETAIL_HOLD = 48;
const DETAIL_TRANSITION = 22;

const focusScenes: {
  src: string;
  focusRect: { x: number; y: number; width: number; height: number };
  kicker: string;
  title: string;
  description: string;
  highlight?: boolean;
}[] = [
  {
    src: "screenshots/workflow-overview.png",
    focusRect: { x: 1152, y: 85.5, width: 384, height: 54 },
    kicker: "Step 1",
    title: "Pick a ticker",
    description: "Start with a random liquid ticker or search for one you're watching.",
    highlight: true,
  },
  {
    src: "screenshots/workflow-overview.png",
    focusRect: { x: 384, y: 155.5, width: 320, height: 520 },
    kicker: "Step 2",
    title: "Read the snapshot",
    description: "Price, market bias, RSI, and volatility context before looking at any strategy.",
    highlight: true,
  },
  {
    src: "screenshots/workflow-overview.png",
    focusRect: { x: 720, y: 199.5, width: 816, height: 540 },
    kicker: "Step 3",
    title: "Compare trade ideas",
    description: "Every card shows max profit, max loss, probability of profit, and capital required.",
    highlight: true,
  },
];

const pageScenes: {
  src: string;
  focusRect: { x: number; y: number; width: number; height: number };
  kicker: string;
  title: string;
  description: string;
}[] = [
  {
    src: "screenshots/workflow-tutorial.png",
    focusRect: { x: 160, y: 0, width: 1600, height: 700 },
    kicker: "Learn more",
    title: "Options fundamentals",
    description: "Vocabulary, moneyness, time decay, and the four foundational strategies, explained plainly.",
  },
  {
    src: "screenshots/workflow-faq.png",
    focusRect: { x: 160, y: 0, width: 1600, height: 700 },
    kicker: "Learn more",
    title: "Answers to common questions",
    description: "From what one contract controls to whether a naked short is safe for beginners.",
  },
];

const detailStops = [
  {
    rect: { x: 25, y: 25, width: 352, height: 197 },
    label: "Open the detail",
    description: "Expand any card to see the full reasoning and math behind it.",
  },
  {
    rect: { x: 41, y: 239, width: 320, height: 222.5 },
    label: "Why this trade",
    description: "Plain-English reasoning behind the recommendation.",
  },
  {
    rect: { x: 41, y: 481.5, width: 320, height: 130.5 },
    label: "The trade",
    description: "The exact legs, price, and breakeven for this position.",
  },
  {
    rect: { x: 41, y: 632, width: 320, height: 159.5 },
    label: "Profit at expiration",
    description: "See the payoff at any price before you commit.",
  },
  {
    rect: { x: 41, y: 811.5, width: 320, height: 585.75 },
    label: "What the Greeks mean",
    description: "Delta, gamma, theta, and vega — translated into plain English.",
  },
  {
    rect: { x: 41, y: 1417.25, width: 320, height: 245.25 },
    label: "What could go wrong",
    description: "The specific risks that could affect this trade.",
  },
];

const DETAIL_IMAGE_WIDTH = 402;
const DETAIL_IMAGE_HEIGHT = 1703.5;
const DETAIL_DURATION = scrollDetailDuration(detailStops.length, DETAIL_HOLD, DETAIL_TRANSITION);

const REGULAR_SCENE_COUNT = focusScenes.length + pageScenes.length;
const SEGMENT_COUNT = REGULAR_SCENE_COUNT + 1; // + the detail scroll scene
const TRANSITION_COUNT = SEGMENT_COUNT + 1; // + the intro cut

const TOTAL_DURATION =
  INTRO_DURATION +
  SCENE_DURATION * REGULAR_SCENE_COUNT +
  DETAIL_DURATION -
  TRANSITION_DURATION * TRANSITION_COUNT;

export const WalkthroughVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <FocusScene
            src={focusScenes[0].src}
            focusRect={focusScenes[0].focusRect}
            kicker={focusScenes[0].kicker}
            title={focusScenes[0].title}
            description={focusScenes[0].description}
            highlight={focusScenes[0].highlight}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <FocusScene
            src={focusScenes[1].src}
            focusRect={focusScenes[1].focusRect}
            kicker={focusScenes[1].kicker}
            title={focusScenes[1].title}
            description={focusScenes[1].description}
            highlight={focusScenes[1].highlight}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <FocusScene
            src={focusScenes[2].src}
            focusRect={focusScenes[2].focusRect}
            kicker={focusScenes[2].kicker}
            title={focusScenes[2].title}
            description={focusScenes[2].description}
            highlight={focusScenes[2].highlight}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={DETAIL_DURATION}>
          <ScrollDetailScene
            src="screenshots/workflow-detail-full.png"
            imageWidth={DETAIL_IMAGE_WIDTH}
            imageHeight={DETAIL_IMAGE_HEIGHT}
            kicker="Step 4"
            stops={detailStops}
            holdFrames={DETAIL_HOLD}
            transitionFrames={DETAIL_TRANSITION}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <FocusScene
            src={pageScenes[0].src}
            focusRect={pageScenes[0].focusRect}
            kicker={pageScenes[0].kicker}
            title={pageScenes[0].title}
            description={pageScenes[0].description}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <FocusScene
            src={pageScenes[1].src}
            focusRect={pageScenes[1].focusRect}
            kicker={pageScenes[1].kicker}
            title={pageScenes[1].title}
            description={pageScenes[1].description}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const WalkthroughComposition = () => {
  return (
    <Composition
      id="Walkthrough"
      component={WalkthroughVideo}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
