// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Browser-side canonical-ready config assert helper:
// browser evaluation expects escalation leaves to be present explicitly and
// does not supplement them through compatibility fallback paths.
export function assertCanonicalEscalationLeaves(config) {
  const actionEscalation = config?.escalations?.action?.fanLowToHigh;
  const stateEscalation = config?.escalations?.state?.hotToCritical;

  if (typeof stateEscalation?.durationMs !== "number") {
    throw new Error("escalations.state.hotToCritical.durationMs is required for browser evaluation");
  }

  if (typeof actionEscalation?.durationMs !== "number") {
    throw new Error("escalations.action.fanLowToHigh.durationMs is required for browser evaluation");
  }

  if (typeof actionEscalation?.requireNoCoolingEffect !== "boolean") {
    throw new Error("escalations.action.fanLowToHigh.requireNoCoolingEffect is required for browser evaluation");
  }
}
