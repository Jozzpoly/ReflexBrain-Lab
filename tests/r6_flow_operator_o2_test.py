"""Source-anchored transport controls; sum conservation is NOT artificial life."""
import unittest
import numpy as np
from scripts.r6_flow_transport_probe import N,seed,researcher_flow,reintegration,experiment

class TransportOnly(unittest.TestCase):
    def test_source_and_flow_are_finite(self):
        a=seed()
        self.assertEqual(a.shape,(N,N))
        self.assertGreater(float(a.sum()),1)
        for kind in ["still","uniform","varying","reverse"]:
            self.assertTrue(np.isfinite(researcher_flow(kind)).all())
    def test_one_step_mass_wall_and_torus(self):
        a=seed()
        for border in ("wall","torus"):
            for flow in ["still","uniform","varying","reverse"]:
                with self.subTest(border=border,flow=flow):
                    b=reintegration(a,researcher_flow(flow),border)
                    self.assertGreaterEqual(float(b.min()),0)
                    self.assertLess(abs(float(a.sum()-b.sum())),1e-9)
    def test_experiment_all_cases_and_spatial_difference(self):
        r=experiment()
        self.assertEqual(len(r["cases"]),10)
        for x in r["cases"]:
            self.assertLess(x["max_absolute_step_mass_error"],1e-9)
        for x in r["pairwise"].values():
            self.assertGreater(x["still_vs_uniform_mass_field_L1"],.01)
    def test_nonexistent_material_cannot_be_adaptively_generated(self):
        z=np.zeros((N,N),dtype=np.float64)
        b=reintegration(z,researcher_flow("varying"),"torus")
        self.assertEqual(float(b.sum()),0)
if __name__=="__main__":unittest.main()
