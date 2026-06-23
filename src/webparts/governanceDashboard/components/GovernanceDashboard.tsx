import * as React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { Icon } from '@fluentui/react/lib/Icon';

import { IGovernanceDashboardProps } from './IGovernanceDashboardProps';
import { ISiteHealth, IGovernanceSummary } from '../models';
import { GovernanceAnalyzer } from '../services/GovernanceAnalyzer';
import SummaryCards from './SummaryCards';
import HealthFilters from './HealthFilters';
import SiteHealthTable from './SiteHealthTable';
import { GovernanceFilter, matchesFilter, matchesSearch } from './filters';
import { formatDate } from './format';
import styles from './GovernanceDashboard.module.scss';

const ALL_FILTERS: GovernanceFilter[] = ['all', 'issues', 'stale', 'inactive', 'storage', 'permissions'];

const GovernanceDashboard: React.FC<IGovernanceDashboardProps> = (props) => {
  const { title, usagePeriod, maxGroups, thresholds, useSampleData, hasTeamsContext } = props;

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [sites, setSites] = React.useState<ISiteHealth[]>([]);
  const [summary, setSummary] = React.useState<IGovernanceSummary | undefined>(undefined);
  const [filter, setFilter] = React.useState<GovernanceFilter>('issues');
  const [search, setSearch] = React.useState<string>('');
  const [refreshKey, setRefreshKey] = React.useState<number>(0);

  // Keep the latest service provider in a ref so the data effect can depend on
  // primitive inputs only and avoid refetching when the parent re-renders.
  const providerRef = React.useRef(props.serviceProvider);
  providerRef.current = props.serviceProvider;

  const thresholdsKey = JSON.stringify(thresholds);

  React.useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      setError(undefined);
      try {
        const service = await providerRef.current();
        const [usage, groups] = await Promise.all([
          service.getSiteUsage(usagePeriod),
          service.getGroupGovernance(maxGroups)
        ]);
        const analyzed = GovernanceAnalyzer.analyze(usage, groups, thresholds);
        if (!cancelled) {
          setSites(analyzed);
          setSummary(GovernanceAnalyzer.summarize(analyzed));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usagePeriod, maxGroups, thresholdsKey, useSampleData, refreshKey]);

  const visible = React.useMemo(
    () => sites.filter((s) => matchesFilter(s, filter) && matchesSearch(s, search)),
    [sites, filter, search]
  );

  const counts = React.useMemo(() => {
    const c = {} as Record<GovernanceFilter, number>;
    for (const f of ALL_FILTERS) {
      c[f] = sites.filter((s) => matchesFilter(s, f)).length;
    }
    return c;
  }, [sites]);

  return (
    <section className={`${styles.governanceDashboard} ${hasTeamsContext ? styles.teams : ''}`}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Icon iconName="Diagnostic" className={styles.headerIcon} />
          <div>
            <h2 className={styles.title}>{title}</h2>
            <span className={styles.subtitle}>
              {useSampleData ? 'Sample data' : `Microsoft Graph · ${usagePeriod}`}
              {summary ? ` · generated ${formatDate(summary.generatedAt)}` : ''}
            </span>
          </div>
        </div>
        <DefaultButton
          iconProps={{ iconName: 'Refresh' }}
          text="Refresh"
          disabled={loading}
          onClick={() => setRefreshKey((k) => k + 1)}
        />
      </header>

      {useSampleData && (
        <MessageBar messageBarType={MessageBarType.info} isMultiline={false}>
          Showing sample data. Turn off &quot;Use sample data&quot; in the property pane to query your tenant via Microsoft Graph.
        </MessageBar>
      )}

      {error && (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          Could not load governance data: {error}
        </MessageBar>
      )}

      {summary && <SummaryCards summary={summary} />}

      <HealthFilters
        filter={filter}
        search={search}
        counts={counts}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
      />

      {loading ? (
        <div className={styles.loading}>
          <Spinner size={SpinnerSize.large} label="Querying Microsoft Graph…" />
        </div>
      ) : visible.length === 0 ? (
        <div className={styles.empty}>
          <Icon iconName="SkypeCircleCheck" className={styles.emptyIcon} />
          <span>No sites match the current filter. {sites.length > 0 ? 'Everything here looks healthy.' : ''}</span>
        </div>
      ) : (
        <SiteHealthTable sites={visible} />
      )}
    </section>
  );
};

export default GovernanceDashboard;
