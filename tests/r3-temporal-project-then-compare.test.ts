import {
  describe,
  expect,
  it,
} from "vitest";
import {
  buildR3ProjectedTemporalRelationFeature,
} from "../src/r3/temporal-project-then-compare";

describe("R3 temporal project-then-compare feature", () => {
  it("returns one symmetric absolute projected-state distance", () => {
    expect(
      buildR3ProjectedTemporalRelationFeature(
        0.8,
        0.25,
      ),
    ).toEqual([
      0.55,
    ]);

    expect(
      buildR3ProjectedTemporalRelationFeature(
        0.25,
        0.8,
      ),
    ).toEqual([
      0.55,
    ]);
  });

  it("rejects values outside probability space", () => {
    expect(() =>
      buildR3ProjectedTemporalRelationFeature(
        -0.1,
        0.5,
      ),
    ).toThrow();
    expect(() =>
      buildR3ProjectedTemporalRelationFeature(
        0.5,
        1.1,
      ),
    ).toThrow();
  });
});
