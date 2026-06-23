import { IGraphService } from '../services/IGraphService';
import { IGovernanceThresholds } from '../models';
import { UsagePeriod } from '../services/GraphTypes';

export interface IGovernanceDashboardProps {
  title: string;
  usagePeriod: UsagePeriod;
  maxGroups: number;
  thresholds: IGovernanceThresholds;
  useSampleData: boolean;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  /**
   * Lazily resolves the data source. The web part decides whether to return a
   * live {@link GraphService} or the MockGraphService based on the
   * "Use sample data" property, keeping this component transport-agnostic.
   */
  serviceProvider: () => Promise<IGraphService>;
}
