/** Overall severity assigned to a site after all governance rules are applied. */
export enum HealthSeverity {
  Healthy = 'Healthy',
  Warning = 'Warning',
  Critical = 'Critical'
}

/** Individual governance issues a site can exhibit. A site may have several. */
export enum GovernanceFlag {
  /** No activity for >= staleDays. */
  Stale = 'Stale',
  /** No activity for >= inactiveDays (or never active in the reporting window). */
  Inactive = 'Inactive',
  /** Storage usage >= storageWarnPercent of quota. */
  StorageWarning = 'StorageWarning',
  /** Storage usage >= storageCriticalPercent of quota. */
  StorageCritical = 'StorageCritical',
  /** Connected group has zero owners. */
  Orphaned = 'Orphaned',
  /** Connected group has fewer than minOwners owners (single point of failure). */
  SinglePointOfFailure = 'SinglePointOfFailure',
  /** Connected group contains guest (external) members. */
  ExternalAccess = 'ExternalAccess'
}

/** A single site after raw Graph telemetry has been merged and analysed. */
export interface ISiteHealth {
  siteId: string;
  title: string;
  url: string;
  owner: string;
  storageUsedBytes: number;
  storageAllocatedBytes: number;
  /** 0-100, used / allocated. */
  storagePercent: number;
  fileCount: number;
  activeFileCount: number;
  pageViews: number;
  lastActivityDate?: Date;
  /** Whole days between lastActivityDate and the analysis date; undefined if never active. */
  daysSinceActivity?: number;
  /** From the connected M365 group, when one could be matched. */
  ownerCount?: number;
  guestCount?: number;
  flags: GovernanceFlag[];
  severity: HealthSeverity;
}
