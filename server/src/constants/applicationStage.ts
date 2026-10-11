/** How far a borrower has got. Drives the Sales lead list (see docs/DESIGN.md §4). */
export const APPLICATION_STAGES = {
  REGISTERED: 'REGISTERED',
  BRE_FAILED: 'BRE_FAILED',
  ELIGIBLE: 'ELIGIBLE',
  APPLIED: 'APPLIED',
} as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[keyof typeof APPLICATION_STAGES];
