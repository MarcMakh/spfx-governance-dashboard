import { ISiteHealth, GovernanceFlag, HealthSeverity } from '../models';

export type GovernanceFilter = 'all' | 'issues' | 'stale' | 'inactive' | 'storage' | 'permissions';

const hasAny = (site: ISiteHealth, flags: GovernanceFlag[]): boolean =>
  flags.some((f) => site.flags.indexOf(f) !== -1);

/** True when a site belongs in the currently selected filter tab. */
export function matchesFilter(site: ISiteHealth, filter: GovernanceFilter): boolean {
  switch (filter) {
    case 'issues':
      return site.severity !== HealthSeverity.Healthy;
    case 'stale':
      return hasAny(site, [GovernanceFlag.Stale]);
    case 'inactive':
      return hasAny(site, [GovernanceFlag.Inactive]);
    case 'storage':
      return hasAny(site, [GovernanceFlag.StorageWarning, GovernanceFlag.StorageCritical]);
    case 'permissions':
      return hasAny(site, [
        GovernanceFlag.Orphaned,
        GovernanceFlag.SinglePointOfFailure,
        GovernanceFlag.ExternalAccess
      ]);
    case 'all':
    default:
      return true;
  }
}

/** Free-text match across the most relevant site fields. */
export function matchesSearch(site: ISiteHealth, term: string): boolean {
  if (!term) {
    return true;
  }
  const q = term.toLowerCase();
  return (
    site.title.toLowerCase().indexOf(q) !== -1 ||
    site.url.toLowerCase().indexOf(q) !== -1 ||
    site.owner.toLowerCase().indexOf(q) !== -1
  );
}
