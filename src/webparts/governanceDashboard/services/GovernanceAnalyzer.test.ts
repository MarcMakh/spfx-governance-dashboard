import { GovernanceAnalyzer } from './GovernanceAnalyzer';
import { ISiteUsageRow, IGroupGovernance } from './GraphTypes';
import { IGovernanceThresholds, GovernanceFlag, HealthSeverity } from '../models';

const THRESHOLDS: IGovernanceThresholds = {
  staleDays: 90,
  inactiveDays: 180,
  storageWarnPercent: 75,
  storageCriticalPercent: 90,
  minOwners: 2
};

const ASOF = new Date('2026-06-22T00:00:00Z');

function usage(overrides: Partial<ISiteUsageRow> = {}): ISiteUsageRow {
  return {
    siteId: 'site-1',
    siteUrl: 'https://contoso.sharepoint.com/sites/Marketing',
    ownerDisplayName: 'Ada Lovelace',
    isDeleted: false,
    lastActivityDate: '2026-06-20',
    fileCount: 100,
    activeFileCount: 10,
    pageViewCount: 50,
    storageUsedInBytes: 10,
    storageAllocatedInBytes: 100,
    rootWebTemplate: 'Group',
    ...overrides
  };
}

function group(overrides: Partial<IGroupGovernance> = {}): IGroupGovernance {
  return {
    groupId: 'g1',
    displayName: 'Marketing',
    webUrl: 'https://contoso.sharepoint.com/sites/Marketing',
    ownerCount: 2,
    guestCount: 0,
    ...overrides
  };
}

describe('GovernanceAnalyzer.analyze - activity', () => {
  it('flags a healthy, recently active site as Healthy with no flags', () => {
    const [site] = GovernanceAnalyzer.analyze([usage()], [group()], THRESHOLDS, ASOF);
    expect(site.flags).toEqual([]);
    expect(site.severity).toBe(HealthSeverity.Healthy);
    expect(site.daysSinceActivity).toBe(2);
  });

  it('flags Stale when activity is older than staleDays but within inactiveDays', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ lastActivityDate: '2026-02-01' })], // ~141 days
      [group()],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.Stale);
    expect(site.flags).not.toContain(GovernanceFlag.Inactive);
    expect(site.severity).toBe(HealthSeverity.Warning);
  });

  it('flags Inactive when activity is older than inactiveDays', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ lastActivityDate: '2025-06-01' })], // > 365 days
      [group()],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.Inactive);
    expect(site.severity).toBe(HealthSeverity.Critical);
  });

  it('treats a missing activity date as Inactive', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ lastActivityDate: undefined })],
      [group()],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.Inactive);
    expect(site.daysSinceActivity).toBeUndefined();
  });
});

describe('GovernanceAnalyzer.analyze - storage', () => {
  it('flags StorageWarning at the warn threshold', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ storageUsedInBytes: 80, storageAllocatedInBytes: 100 })],
      [group()],
      THRESHOLDS,
      ASOF
    );
    expect(site.storagePercent).toBe(80);
    expect(site.flags).toContain(GovernanceFlag.StorageWarning);
    expect(site.flags).not.toContain(GovernanceFlag.StorageCritical);
  });

  it('flags StorageCritical at the critical threshold', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ storageUsedInBytes: 95, storageAllocatedInBytes: 100 })],
      [group()],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.StorageCritical);
    expect(site.severity).toBe(HealthSeverity.Critical);
  });

  it('handles zero allocated storage without dividing by zero', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ storageUsedInBytes: 5, storageAllocatedInBytes: 0 })],
      [group()],
      THRESHOLDS,
      ASOF
    );
    expect(site.storagePercent).toBe(0);
    expect(site.flags).not.toContain(GovernanceFlag.StorageWarning);
  });
});

describe('GovernanceAnalyzer.analyze - ownership & external access', () => {
  it('flags Orphaned when the connected group has no owners', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage()],
      [group({ ownerCount: 0 })],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.Orphaned);
    expect(site.severity).toBe(HealthSeverity.Critical);
  });

  it('flags SinglePointOfFailure when owners are below the minimum', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage()],
      [group({ ownerCount: 1 })],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.SinglePointOfFailure);
    expect(site.severity).toBe(HealthSeverity.Warning);
  });

  it('flags ExternalAccess when guests are present', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage()],
      [group({ guestCount: 3 })],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.ExternalAccess);
    expect(site.guestCount).toBe(3);
  });

  it('does not apply ownership flags when no group can be matched', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ siteUrl: 'https://contoso.sharepoint.com/sites/NoGroup' })],
      [group()], // different URL
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).not.toContain(GovernanceFlag.Orphaned);
    expect(site.ownerCount).toBeUndefined();
  });

  it('matches groups to sites case-insensitively and ignores trailing slashes', () => {
    const [site] = GovernanceAnalyzer.analyze(
      [usage({ siteUrl: 'https://contoso.sharepoint.com/sites/Marketing/' })],
      [group({ webUrl: 'https://CONTOSO.sharepoint.com/sites/marketing', ownerCount: 0 })],
      THRESHOLDS,
      ASOF
    );
    expect(site.flags).toContain(GovernanceFlag.Orphaned);
  });
});

describe('GovernanceAnalyzer.summarize', () => {
  it('rolls up counts and storage totals across sites', () => {
    const sites = GovernanceAnalyzer.analyze(
      [
        usage({ siteId: 's1', siteUrl: 'https://c.sharepoint.com/sites/A' }), // healthy
        usage({
          siteId: 's2',
          siteUrl: 'https://c.sharepoint.com/sites/B',
          lastActivityDate: '2025-01-01' // inactive
        }),
        usage({
          siteId: 's3',
          siteUrl: 'https://c.sharepoint.com/sites/C',
          storageUsedInBytes: 95,
          storageAllocatedInBytes: 100 // storage critical
        })
      ],
      [],
      THRESHOLDS,
      ASOF
    );

    const summary = GovernanceAnalyzer.summarize(sites, ASOF);
    expect(summary.totalSites).toBe(3);
    expect(summary.healthySites).toBe(1);
    expect(summary.inactiveSites).toBe(1);
    expect(summary.storageAtRisk).toBe(1);
    expect(summary.totalStorageUsedBytes).toBe(10 + 10 + 95);
  });
});
