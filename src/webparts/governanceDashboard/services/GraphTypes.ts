/** Reporting window accepted by the Microsoft Graph usage reports API. */
export type UsagePeriod = 'D7' | 'D30' | 'D90' | 'D180';

/**
 * One row of `/reports/getSharePointSiteUsageDetail` requested as JSON.
 * Field names mirror the Microsoft Graph JSON projection.
 */
export interface ISiteUsageRow {
  siteId: string;
  siteUrl: string;
  ownerDisplayName: string;
  ownerPrincipalName?: string;
  isDeleted: boolean;
  /** ISO date string (yyyy-mm-dd) or empty when there was no activity in the window. */
  lastActivityDate?: string;
  fileCount: number;
  activeFileCount: number;
  pageViewCount: number;
  storageUsedInBytes: number;
  storageAllocatedInBytes: number;
  rootWebTemplate?: string;
}

/**
 * Ownership / external-access signal derived from the Microsoft 365 group that
 * backs a group-connected site.
 */
export interface IGroupGovernance {
  groupId: string;
  displayName: string;
  /** webUrl of the group's root site, used to join back to usage rows. */
  webUrl?: string;
  ownerCount: number;
  guestCount: number;
}
