"""Reproduction integrity, NOT a model-of-life test. See ARMED protocol."""
import unittest
from scripts.r6_orbium_probe import SPEC, SEED_PATCH, evolve, experiment
class OriginalDonor(unittest.TestCase):
    def test_exact_published_seed_and_parameters(self):
        self.assertEqual(SEED_PATCH.shape, (20,20))
        self.assertAlmostEqual(float(SEED_PATCH.sum()),75.1,places=3)
        self.assertEqual(SPEC["params"]["sigma"], .014)
        self.assertEqual(SPEC["params"]["delta_type"], 0)
    def test_blank_world_remains_blank(self):
        r=evolve("blank", 150)
        self.assertEqual(r["measurements"][-1]["mass"], 0)
    def test_reference_pattern_remains_observable(self):
        r=evolve("intact")
        self.assertGreater(r["measurements"][-1]["mass"], 5,
          "Cannot interpret damage experiments if unperturbed donor does not survive")
    def test_determinism_of_identical_unperturbed_run(self):
        self.assertEqual(evolve("intact"), evolve("intact"))
if __name__=="__main__":unittest.main()
