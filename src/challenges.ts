import type { Episode } from "./episode";
import { createR0CounterfactualEpisode } from "./episode";

export interface SemanticChallenge {
  id: string;
  title: string;
  episode: Episode;
}

/**
 * Stronger R0 situations used only to test whether the semantic readout
 * actually changes with materially different actor-private state.
 *
 * No gold action is encoded here. The suite is diagnostic, not supervised.
 */
export function createSemanticChallenges(): readonly SemanticChallenge[] {
  const requestText = "Can you help me with this for a moment?";

  return [
    {
      id: "silent-pass",
      title: "Silent nearby pass",
      episode: createR0CounterfactualEpisode({
        speechExposure: "none",
        idSuffix: "challenge-silent-pass",
        title: "Challenge · silent nearby pass",
      }),
    },
    {
      id: "addressed-request",
      title: "Addressed request",
      episode: createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText: requestText,
        idSuffix: "challenge-addressed-request",
        title: "Challenge · addressed request",
      }),
    },
    {
      id: "overheard-request",
      title: "Same request, overheard",
      episode: createR0CounterfactualEpisode({
        speechExposure: "overheard",
        speechText: requestText,
        idSuffix: "challenge-overheard-request",
        title: "Challenge · same request overheard",
      }),
    },
    {
      id: "urgent-warning",
      title: "Addressed urgent warning",
      episode: createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText: "Watch out! Move away now!",
        idSuffix: "challenge-urgent-warning",
        title: "Challenge · addressed urgent warning",
      }),
    },
    {
      id: "fast-close",
      title: "Silent fast close approach",
      episode: createR0CounterfactualEpisode({
        speechExposure: "none",
        playerMotion: "fast_close",
        idSuffix: "challenge-fast-close",
        title: "Challenge · silent fast close approach",
      }),
    },
  ];
}
