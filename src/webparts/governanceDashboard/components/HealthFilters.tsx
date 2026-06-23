import * as React from 'react';
import { Pivot, PivotItem } from '@fluentui/react/lib/Pivot';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { GovernanceFilter } from './filters';
import styles from './GovernanceDashboard.module.scss';

export interface IHealthFiltersProps {
  filter: GovernanceFilter;
  search: string;
  counts: Record<GovernanceFilter, number>;
  onFilterChange: (filter: GovernanceFilter) => void;
  onSearchChange: (term: string) => void;
}

const TABS: { key: GovernanceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'issues', label: 'Issues' },
  { key: 'stale', label: 'Stale' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'storage', label: 'Storage' },
  { key: 'permissions', label: 'Permissions' }
];

const HealthFilters: React.FC<IHealthFiltersProps> = (props) => {
  const { filter, search, counts, onFilterChange, onSearchChange } = props;

  return (
    <div className={styles.filterBar}>
      <Pivot
        selectedKey={filter}
        onLinkClick={(item) => onFilterChange((item?.props.itemKey as GovernanceFilter) || 'all')}
        headersOnly
        aria-label="Filter sites by governance category"
      >
        {TABS.map((t) => (
          <PivotItem key={t.key} itemKey={t.key} headerText={t.label} itemCount={counts[t.key]} />
        ))}
      </Pivot>
      <SearchBox
        className={styles.searchBox}
        placeholder="Search site, URL or owner"
        value={search}
        onChange={(_, v) => onSearchChange(v || '')}
        onClear={() => onSearchChange('')}
      />
    </div>
  );
};

export default HealthFilters;
