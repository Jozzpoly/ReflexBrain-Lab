import { describe, expect, it } from "vitest";
import {
  buildR3TemporalFactorFeatures,
} from "../src/r3/temporal-factor-features";

describe("R3 temporal factor feature", () => {
  it("builds the frozen absolute history-current difference", () => {
    expect(
      buildR3TemporalFactorFeatures(
        [0.1, -0.2, 0.8],
        [0.4, -0.1, 0.3],
      ),
    ).toEqual([
      0.30000000000000004,
      0.1,
      0.5,
    ]);
  });

  it("rejects empty or mismatched embeddings", () => {
    expect(() =>
      buildR3TemporalFactorFeatures(
        [],
        [],
      ),
    ).toThrow();

    expect(() =>
      buildR3TemporalFactorFeatures(
        [0.1],
        [0.1, 0.2],
      ),
    ).toThrow();
  });
});
