import {
  createR3ListenerEffectorRun,
  type R3ListenerEffectorMode,
  type R3ListenerEffectorRun,
} from "./grounded-listener-effector-run";

export function createR3PersistentGroundedReportRun(
  mode: R3ListenerEffectorMode,
): R3ListenerEffectorRun {
  return createR3ListenerEffectorRun(
    mode,
    {
      idaPosition: {
        x: 6,
        y: 1,
      },
      janekWorkerOptions: {
        blockedRequestAfterTicks: 45,
        requestCooldownTicks: 45,
      },
    },
  );
}
