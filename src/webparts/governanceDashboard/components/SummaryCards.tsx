import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IGovernanceSummary } from '../models';
import { formatBytes, formatNumber } from './format';
import styles from './GovernanceDashboard.module.scss';

export interface ISummaryCardsProps {
  summary: IGovernanceSummary;
}

interface ICard {
  key: string;
  label: string;
  value: string;
  icon: string;
  tone: 'neutral' | 'good' | 'warn' | 'critical';
}

const SummaryCards: React.FC<ISummaryCardsProps> = ({ summary }) => {
  const storagePct =
    summary.totalStorageAllocatedBytes > 0
      ? Math.round((summary.totalStorageUsedBytes / summary.totalStorageAllocatedBytes) * 100)
      : 0;

  const cards: ICard[] = [
    { key: 'total', label: 'Total sites', value: formatNumber(summary.totalSites), icon: 'SharepointLogo', tone: 'neutral' },
    { key: 'healthy', label: 'Healthy', value: formatNumber(summary.healthySites), icon: 'CompletedSolid', tone: 'good' },
    { key: 'stale', label: 'Stale sites', value: formatNumber(summary.staleSites), icon: 'Clock', tone: 'warn' },
    { key: 'inactive', label: 'Inactive sites', value: formatNumber(summary.inactiveSites), icon: 'Blocked2', tone: 'critical' },
    { key: 'storage', label: 'Storage at risk', value: formatNumber(summary.storageAtRisk), icon: 'OfflineStorage', tone: 'warn' },
    { key: 'perms', label: 'Permission anomalies', value: formatNumber(summary.permissionAnomalies), icon: 'Permissions', tone: 'critical' },
    { key: 'used', label: `Storage used (${storagePct}%)`, value: formatBytes(summary.totalStorageUsedBytes), icon: 'DataManagementSettings', tone: 'neutral' }
  ];

  return (
    <div className={styles.summaryGrid}>
      {cards.map((c) => (
        <div key={c.key} className={`${styles.summaryCard} ${styles[c.tone]}`} role="group" aria-label={c.label}>
          <Icon iconName={c.icon} className={styles.summaryIcon} />
          <div className={styles.summaryValue}>{c.value}</div>
          <div className={styles.summaryLabel}>{c.label}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
