import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        r3Probe: "r3-probe.html",
        r3MixedPressureProbe:
          "r3-mixed-pressure-probe.html",
        r3JointRelationProbe:
          "r3-joint-relation-probe.html",
        r3TemporalFactorProbe:
          "r3-temporal-factor-probe.html",
        r3TemporalRepresentationRelationFalsifier:
          "r3-temporal-representation-relation-falsifier.html",
        r3TemporalSymmetricInteractionProbe:
          "r3-temporal-symmetric-interaction-probe.html",
        r3TemporalProjectThenCompareDiagnostic:
          "r3-temporal-project-then-compare-diagnostic.html",
        r3ZeroShotGroundedSemanticBridge:
          "r3-zero-shot-grounded-semantic-bridge.html",
        e0AuthoritativeBody:
          "probes/e0-authoritative-body.html",
      },
    },
  },
});
