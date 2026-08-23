import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Fragment } from "react";
import { AbsoluteFill, Composition } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";
import { ScreenshotScene } from "./scenes/ScreenshotScene";
import { colors } from "./theme";

const FPS = 30;
const INTRO_DURATION = 2 * FPS;
const SCENE_DURATION = 3 * FPS;
const OUTRO_DURATION = 2.5 * FPS;
const TRANSITION_DURATION = 12;
const SCENE_COUNT = 4;
const TRANSITION_COUNT = SCENE_COUNT + 1;

const TOTAL_DURATION =
  INTRO_DURATION + SCENE_DURATION * SCENE_COUNT + OUTRO_DURATION - TRANSITION_DURATION * TRANSITION_COUNT;

const scenes: {
  src: string;
  kicker: string;
  title: string;
  description: string;
  panDirection: "left" | "right";
}[] = [
  {
    src: "screenshots/ideas.png",
    kicker: "Strategy explorer",
    title: "Compare strategy ideas side by side",
    description: "Every card shows max profit, max loss, probability of profit, and capital required.",
    panDirection: "right",
  },
  {
    src: "screenshots/tutorial.png",
    kicker: "Tutorial",
    title: "Learn the fundamentals",
    description: "Vocabulary, moneyness, time decay, and the four foundational strategies, explained plainly.",
    panDirection: "left",
  },
  {
    src: "screenshots/how-to.png",
    kicker: "How to",
    title: "Get started in four steps",
    description: "A quick walkthrough of picking a ticker, reading the snapshot, and comparing trades.",
    panDirection: "right",
  },
  {
    src: "screenshots/faq.png",
    kicker: "FAQ",
    title: "Answers to common questions",
    description: "From what one contract controls to whether a naked short is safe for beginners.",
    panDirection: "left",
  },
];

export const WalkthroughVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
          <IntroScene />
        </TransitionSeries.Sequence>

        {scenes.map((scene) => (
          <Fragment key={scene.src}>
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
            />
            <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
              <ScreenshotScene
                src={scene.src}
                kicker={scene.kicker}
                title={scene.title}
                description={scene.description}
                panDirection={scene.panDirection}
              />
            </TransitionSeries.Sequence>
          </Fragment>
        ))}

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <OutroScene />
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
