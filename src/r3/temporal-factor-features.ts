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


export function buildR3TemporalSymmetricInteractionFeatures(
  history: readonly number[],
  current: readonly number[],
): number[] {
  if (
    history.length === 0 ||
    history.length !== current.length
  ) {
    throw new Error(
      "temporal symmetric interaction features require equal non-empty embedding dimensions",
    );
  }

  const dimensions =
    history.length;
  const features =
    new Array<number>(
      dimensions * 2,
    );

  for (
    let index = 0;
    index < dimensions;
    index += 1
  ) {
    const left =
      history[index]!;
    const right =
      current[index]!;
    features[index] =
      Math.abs(
        left - right,
      );
    features[
      dimensions + index
    ] =
      left * right;
  }

  return features;
}
