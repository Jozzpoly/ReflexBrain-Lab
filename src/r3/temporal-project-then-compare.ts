export function buildR3ProjectedTemporalRelationFeature(
  historyProbability: number,
  currentProbability: number,
): readonly [number] {
  if (
    !Number.isFinite(
      historyProbability,
    ) ||
    !Number.isFinite(
      currentProbability,
    ) ||
    historyProbability < 0 ||
    historyProbability > 1 ||
    currentProbability < 0 ||
    currentProbability > 1
  ) {
    throw new Error(
      "projected temporal relation requires finite probabilities in [0,1]",
    );
  }

  return [
    Math.abs(
      historyProbability -
        currentProbability,
    ),
  ];
}
