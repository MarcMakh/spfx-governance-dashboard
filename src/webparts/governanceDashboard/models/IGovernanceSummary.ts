/** Tenant-wide roll-up rendered as the summary cards at the top of the dashboard. */
export interface IGovernanceSummary {
  totalSites: number;
  healthySites: number;
  staleSites: number;
  inactiveSites: number;
  /** Sites with a storage warning or critical flag. */
  storageAtRisk: number;
  /** Sites with an orphaned / single-owner / external-access flag. */
  permissionAnomalies: number;
  totalStorageUsedBytes: number;
  totalStorageAllocatedBytes: number;
  generatedAt: Date;
}
