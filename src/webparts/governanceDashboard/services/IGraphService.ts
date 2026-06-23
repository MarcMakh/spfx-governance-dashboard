import { ISiteUsageRow, IGroupGovernance, UsagePeriod } from './GraphTypes';

/**
 * Abstraction over the Microsoft Graph calls the dashboard needs.
 * Implemented by {@link GraphService} (live tenant) and MockGraphService (demo data),
 * which keeps the React layer and the analyzer free of any transport concerns.
 */
export interface IGraphService {
  /** Per-site usage telemetry: storage, last activity, file and page-view counts. */
  getSiteUsage(period: UsagePeriod): Promise<ISiteUsageRow[]>;

  /** Ownership and guest-access signals from group-connected sites. */
  getGroupGovernance(maxGroups?: number): Promise<IGroupGovernance[]>;
}
