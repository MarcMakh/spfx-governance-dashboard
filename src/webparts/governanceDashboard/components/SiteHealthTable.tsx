import * as React from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  SelectionMode
} from '@fluentui/react/lib/DetailsList';
import { Link } from '@fluentui/react/lib/Link';
import { ISiteHealth, GovernanceFlag } from '../models';
import { formatBytes, formatNumber, formatDaysAgo } from './format';
import styles from './GovernanceDashboard.module.scss';

export interface ISiteHealthTableProps {
  sites: ISiteHealth[];
}

const FLAG_META: { [key in GovernanceFlag]: { label: string; tone: string } } = {
  [GovernanceFlag.Stale]: { label: 'Stale', tone: styles.warn },
  [GovernanceFlag.Inactive]: { label: 'Inactive', tone: styles.critical },
  [GovernanceFlag.StorageWarning]: { label: 'Storage 75%+', tone: styles.warn },
  [GovernanceFlag.StorageCritical]: { label: 'Storage 90%+', tone: styles.critical },
  [GovernanceFlag.Orphaned]: { label: 'No owner', tone: styles.critical },
  [GovernanceFlag.SinglePointOfFailure]: { label: 'Single owner', tone: styles.warn },
  [GovernanceFlag.ExternalAccess]: { label: 'External guests', tone: styles.warn }
};

const SiteHealthTable: React.FC<ISiteHealthTableProps> = ({ sites }) => {
  const [sortKey, setSortKey] = React.useState<keyof ISiteHealth>('severity');
  const [sortDesc, setSortDesc] = React.useState<boolean>(true);

  const sorted = React.useMemo(() => {
    const copy = [...sites];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [sites, sortKey, sortDesc]);

  const onColumnClick = (_ev: unknown, column: IColumn): void => {
    const key = column.fieldName as keyof ISiteHealth;
    if (key === sortKey) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const renderStorage = (site: ISiteHealth): JSX.Element => {
    const pct = Math.min(100, Math.round(site.storagePercent));
    const tone = pct >= 90 ? styles.critical : pct >= 75 ? styles.warn : styles.good;
    return (
      <div className={styles.storageCell} title={`${formatBytes(site.storageUsedBytes)} of ${formatBytes(site.storageAllocatedBytes)}`}>
        <div className={styles.storageBarTrack}>
          <div className={`${styles.storageBarFill} ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.storagePct}>{pct}%</span>
      </div>
    );
  };

  const renderFlags = (site: ISiteHealth): JSX.Element => {
    if (site.flags.length === 0) {
      return <span className={`${styles.badge} ${styles.good}`}>Healthy</span>;
    }
    return (
      <div className={styles.badgeRow}>
        {site.flags.map((f) => (
          <span key={f} className={`${styles.badge} ${FLAG_META[f].tone}`}>
            {FLAG_META[f].label}
          </span>
        ))}
      </div>
    );
  };

  const buildColumn = (
    key: keyof ISiteHealth,
    name: string,
    minWidth: number,
    maxWidth: number,
    onRender?: (item: ISiteHealth) => React.ReactNode
  ): IColumn => ({
    key: key as string,
    name,
    fieldName: key as string,
    minWidth,
    maxWidth,
    isResizable: true,
    isSorted: sortKey === key,
    isSortedDescending: sortDesc,
    onColumnClick,
    onRender: onRender as IColumn['onRender']
  });

  const columns: IColumn[] = [
    buildColumn('title', 'Site', 160, 240, (s) => (
      <div>
        <Link href={s.url} target="_blank" rel="noreferrer">
          {s.title}
        </Link>
        <div className={styles.subtle}>{s.url.replace(/^https?:\/\//, '')}</div>
      </div>
    )),
    buildColumn('owner', 'Owner', 120, 180),
    buildColumn('storagePercent', 'Storage', 120, 160, renderStorage),
    buildColumn('daysSinceActivity', 'Last activity', 100, 130, (s) => (
      <span>{formatDaysAgo(s.daysSinceActivity)}</span>
    )),
    buildColumn('fileCount', 'Files', 70, 90, (s) => <span>{formatNumber(s.fileCount)}</span>),
    buildColumn('pageViews', 'Page views', 80, 100, (s) => <span>{formatNumber(s.pageViews)}</span>),
    buildColumn('flags', 'Governance flags', 220, 360, renderFlags)
  ];

  return (
    <DetailsList
      items={sorted}
      columns={columns}
      selectionMode={SelectionMode.none}
      layoutMode={DetailsListLayoutMode.justified}
      isHeaderVisible
      compact={false}
      setKey="governanceSites"
      ariaLabelForGrid="SharePoint sites governance health"
    />
  );
};

export default SiteHealthTable;
