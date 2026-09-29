import { describe, expect, it } from "vitest";
import {
  buildR3TemporalFactorFeatures,
  buildR3TemporalSymmetricInteractionFeatures,
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
  it("builds the frozen symmetric difference-product interaction", () => {
    const forward =
      buildR3TemporalSymmetricInteractionFeatures(
        [0.1, -0.2, 0.8],
        [0.4, -0.1, 0.3],
      );
    const reverse =
      buildR3TemporalSymmetricInteractionFeatures(
        [0.4, -0.1, 0.3],
        [0.1, -0.2, 0.8],
      );

    expect(forward).toEqual([
      0.30000000000000004,
      0.1,
      0.5,
      0.04000000000000001,
      0.020000000000000004,
      0.24,
    ]);
    expect(reverse).toEqual(
      forward,
    );
  });

  it("rejects invalid symmetric interaction embeddings", () => {
    expect(() =>
      buildR3TemporalSymmetricInteractionFeatures(
        [],
        [],
      ),
    ).toThrow();

    expect(() =>
      buildR3TemporalSymmetricInteractionFeatures(
        [0.1],
        [0.1, 0.2],
      ),
    ).toThrow();
  });
});
