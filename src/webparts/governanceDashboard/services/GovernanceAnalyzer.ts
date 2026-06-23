import { ISiteUsageRow, IGroupGovernance } from './GraphTypes';
import {
  ISiteHealth,
  IGovernanceSummary,
  IGovernanceThresholds,
  GovernanceFlag,
  HealthSeverity
} from '../models';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Pure, framework-independent governance rules engine.
 *
 * It joins SharePoint usage telemetry with group ownership signals and applies
 * the configured thresholds. Kept free of React and Graph so it can be unit
 * tested in isolation (see GovernanceAnalyzer.test.ts).
 */
export class GovernanceAnalyzer {
  /**
   * Merge usage rows with group governance signals and classify every site.
   * @param asOf reference date for "days since activity" — injectable for tests.
   */
  public static analyze(
    usage: ISiteUsageRow[],
    groups: IGroupGovernance[],
    thresholds: IGovernanceThresholds,
    asOf: Date = new Date()
  ): ISiteHealth[] {
    const groupByUrl = new Map<string, IGroupGovernance>();
    for (const g of groups) {
      if (g.webUrl) {
        groupByUrl.set(GovernanceAnalyzer.normalizeUrl(g.webUrl), g);
      }
    }

    return usage.map((row) => {
      const group = groupByUrl.get(GovernanceAnalyzer.normalizeUrl(row.siteUrl));
      return GovernanceAnalyzer.classify(row, group, thresholds, asOf);
    });
  }

  /** Aggregate a classified site list into the tenant-wide summary. */
  public static summarize(sites: ISiteHealth[], asOf: Date = new Date()): IGovernanceSummary {
    const has = (s: ISiteHealth, f: GovernanceFlag): boolean => s.flags.indexOf(f) !== -1;

    return {
      totalSites: sites.length,
      healthySites: sites.filter((s) => s.severity === HealthSeverity.Healthy).length,
      staleSites: sites.filter((s) => has(s, GovernanceFlag.Stale)).length,
      inactiveSites: sites.filter((s) => has(s, GovernanceFlag.Inactive)).length,
      storageAtRisk: sites.filter(
        (s) => has(s, GovernanceFlag.StorageWarning) || has(s, GovernanceFlag.StorageCritical)
      ).length,
      permissionAnomalies: sites.filter(
        (s) =>
          has(s, GovernanceFlag.Orphaned) ||
          has(s, GovernanceFlag.SinglePointOfFailure) ||
          has(s, GovernanceFlag.ExternalAccess)
      ).length,
      totalStorageUsedBytes: sites.reduce((sum, s) => sum + s.storageUsedBytes, 0),
      totalStorageAllocatedBytes: sites.reduce((sum, s) => sum + s.storageAllocatedBytes, 0),
      generatedAt: asOf
    };
  }

  private static classify(
    row: ISiteUsageRow,
    group: IGroupGovernance | undefined,
    t: IGovernanceThresholds,
    asOf: Date
  ): ISiteHealth {
    const flags: GovernanceFlag[] = [];

    // --- Activity (stale / inactive) ---
    let lastActivityDate: Date | undefined;
    let daysSinceActivity: number | undefined;
    if (row.lastActivityDate) {
      lastActivityDate = new Date(row.lastActivityDate);
      daysSinceActivity = Math.max(
        0,
        Math.floor((asOf.getTime() - lastActivityDate.getTime()) / MS_PER_DAY)
      );
      if (daysSinceActivity >= t.inactiveDays) {
        flags.push(GovernanceFlag.Inactive);
      } else if (daysSinceActivity >= t.staleDays) {
        flags.push(GovernanceFlag.Stale);
      }
    } else {
      // No activity recorded in the reporting window => treat as inactive.
      flags.push(GovernanceFlag.Inactive);
    }

    // --- Storage ---
    const storagePercent =
      row.storageAllocatedInBytes > 0
        ? (row.storageUsedInBytes / row.storageAllocatedInBytes) * 100
        : 0;
    if (storagePercent >= t.storageCriticalPercent) {
      flags.push(GovernanceFlag.StorageCritical);
    } else if (storagePercent >= t.storageWarnPercent) {
      flags.push(GovernanceFlag.StorageWarning);
    }

    // --- Ownership / external access (only when a group could be matched) ---
    if (group) {
      if (group.ownerCount === 0) {
        flags.push(GovernanceFlag.Orphaned);
      } else if (group.ownerCount < t.minOwners) {
        flags.push(GovernanceFlag.SinglePointOfFailure);
      }
      if (group.guestCount > 0) {
        flags.push(GovernanceFlag.ExternalAccess);
      }
    }

    return {
      siteId: row.siteId,
      title: GovernanceAnalyzer.titleFromUrl(row.siteUrl),
      url: row.siteUrl,
      owner: row.ownerDisplayName,
      storageUsedBytes: row.storageUsedInBytes,
      storageAllocatedBytes: row.storageAllocatedInBytes,
      storagePercent: Math.round(storagePercent * 10) / 10,
      fileCount: row.fileCount,
      activeFileCount: row.activeFileCount,
      pageViews: row.pageViewCount,
      lastActivityDate,
      daysSinceActivity,
      ownerCount: group?.ownerCount,
      guestCount: group?.guestCount,
      flags,
      severity: GovernanceAnalyzer.severityFor(flags)
    };
  }

  private static severityFor(flags: GovernanceFlag[]): HealthSeverity {
    const critical = [
      GovernanceFlag.Inactive,
      GovernanceFlag.StorageCritical,
      GovernanceFlag.Orphaned
    ];
    if (flags.some((f) => critical.indexOf(f) !== -1)) {
      return HealthSeverity.Critical;
    }
    return flags.length > 0 ? HealthSeverity.Warning : HealthSeverity.Healthy;
  }

  private static titleFromUrl(url: string): string {
    if (!url) {
      return '(unknown site)';
    }
    const trimmed = url.replace(/\/+$/, '');
    const last = trimmed.substring(trimmed.lastIndexOf('/') + 1);
    return decodeURIComponent(last) || trimmed;
  }

  private static normalizeUrl(url: string): string {
    return (url || '').replace(/\/+$/, '').toLowerCase();
  }
}
