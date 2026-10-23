"""O1 mass-neutral intervention fidelity. Outcome interpretation in report only."""
import unittest
from scripts.r6_orbium_probe import evolve, experiment_o1

class OrganizationBeyondScalar(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cases={x["case"]:x for x in experiment_o1()["case_results"]}
    def test_instant_interventions_conserve_mass(self):
        for case in ["translate_x5","redistribute_r1","shuffle7"]:
            with self.subTest(case=case):
                p=self.cases[case]["perturbationAt150"]
                self.assertLess(abs(p["lossFraction"]),.00001)
                self.assertAlmostEqual(p["massBefore"],p["massImmediatelyAfter"],places=4)
    def test_periodic_translation_is_not_a_lethal_injury(self):
        original=self.cases["intact"]["measurements"][-1]["mass"]
        shifted=self.cases["translate_x5"]["measurements"][-1]["mass"]
        self.assertAlmostEqual(original,shifted,places=3)
        self.assertTrue(self.cases["translate_x5"]["survived_500_mass_gt5"])
    def test_all_arms_actually_execute_all_500_dynamics_updates(self):
        # Prevent future "t500 alive" results when model updates silently stop.
        for name, arm in self.cases.items():
            with self.subTest(case=name):
                self.assertEqual(arm["executed_updates"],500)
                self.assertIn("499->500",arm["dynamics_samples"])
    def test_rerun_mass_neutral_injury_is_now_a_real_500_step_collapse(self):
        # Post-hoc REGRESSION after bug forensic: older O1 had falsely
        # reported t500 even when 'total' was shadowed and stepping had stopped.
        for case in ["intact","translate_x5","redistribute_r1","shuffle7","remove_1"]:
            self.assertEqual(self.cases[case]["executed_updates"],500)
        self.assertGreater(self.cases["intact"]["dynamics_samples"]["499->500"]["L1"],1)
        self.assertGreater(self.cases["translate_x5"]["dynamics_samples"]["499->500"]["L1"],1)
        for case in ["redistribute_r1","shuffle7"]:
            self.assertFalse(self.cases[case]["survived_500_mass_gt5"])
            self.assertEqual(self.cases[case]["measurements"][-1]["mass"],0.0)
    def test_reference_material_loss_stays_distinct(self):
        self.assertGreater(self.cases["remove_1"]["perturbationAt150"]["lossFraction"],.05)
if __name__=="__main__":unittest.main()
