/**
 * Tunable rules that turn raw Microsoft Graph telemetry into governance signals.
 * Surfaced in the web part property pane so administrators can match their policy.
 */
export interface IGovernanceThresholds {
  /** A site with no activity for at least this many days is flagged Stale. */
  staleDays: number;
  /** A site with no activity for at least this many days is flagged Inactive (more severe than stale). */
  inactiveDays: number;
  /** Storage usage at or above this percentage of quota raises a warning. */
  storageWarnPercent: number;
  /** Storage usage at or above this percentage of quota is critical. */
  storageCriticalPercent: number;
  /** Sites/groups with fewer owners than this are flagged as an ownership risk. */
  minOwners: number;
}

export const DEFAULT_THRESHOLDS: IGovernanceThresholds = {
  staleDays: 90,
  inactiveDays: 180,
  storageWarnPercent: 75,
  storageCriticalPercent: 90,
  minOwners: 2
};
