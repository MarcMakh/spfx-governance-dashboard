/** Presentation helpers shared by the dashboard components. */

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatNumber(value: number): string {
  return (value || 0).toLocaleString();
}

export function formatDate(date?: Date): string {
  if (!date) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDaysAgo(days?: number): string {
  if (days === undefined) {
    return 'No activity';
  }
  if (days === 0) {
    return 'Today';
  }
  return `${days.toLocaleString()} day${days === 1 ? '' : 's'} ago`;
}
