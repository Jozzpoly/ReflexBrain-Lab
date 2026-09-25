export function buildR3TemporalFactorFeatures(
  history: readonly number[],
  current: readonly number[],
): number[] {
  if (
    history.length === 0 ||
    history.length !== current.length
  ) {
    throw new Error(
      "temporal factor features require equal non-empty embedding dimensions",
    );
  }

  return history.map(
    (value, index) =>
      Math.abs(
        value -
          current[index]!,
      ),
  );
}
