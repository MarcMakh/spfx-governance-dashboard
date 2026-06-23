import { IGraphService } from './IGraphService';
import { ISiteUsageRow, IGroupGovernance } from './GraphTypes';

const GB = 1024 * 1024 * 1024;

/** ISO date string for `daysAgo` days before today. */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().substring(0, 10);
}

/**
 * In-memory implementation used by the "Use sample data" property-pane toggle.
 * Lets the web part be demoed in the local workbench or by reviewers who do not
 * have admin consent for the Graph reporting scopes. The shape of the data
 * matches what {@link GraphService} returns from a live tenant.
 */
export class MockGraphService implements IGraphService {
  public async getSiteUsage(): Promise<ISiteUsageRow[]> {
    const rows: ISiteUsageRow[] = [
      this.row('Marketing', 'Ada Lovelace', 18 * GB, 25 * GB, daysAgo(2), 4200, 320),
      this.row('Sales', 'Grace Hopper', 23 * GB, 25 * GB, daysAgo(5), 6100, 510),
      this.row('HR', 'Katherine Johnson', 24.6 * GB, 25 * GB, daysAgo(1), 3050, 90),
      this.row('Finance-Archive', 'Alan Turing', 12 * GB, 25 * GB, daysAgo(140), 980, 0),
      this.row('ProjectApollo', 'Margaret Hamilton', 9 * GB, 25 * GB, daysAgo(220), 1500, 0),
      this.row('Legal', 'Edsger Dijkstra', 6 * GB, 25 * GB, daysAgo(10), 740, 60),
      this.row('IT-Helpdesk', 'Linus Torvalds', 2 * GB, 25 * GB, daysAgo(3), 2200, 410),
      this.row('Comms', 'Radia Perlman', 1.2 * GB, 25 * GB, daysAgo(95), 410, 12),
      this.row('VendorPortal', 'Barbara Liskov', 4 * GB, 25 * GB, daysAgo(7), 1900, 140),
      this.row('OldIntranet', 'Donald Knuth', 0.4 * GB, 25 * GB, '', 0, 0),
      this.row('R-and-D', 'Tim Berners-Lee', 21 * GB, 25 * GB, daysAgo(4), 5200, 600),
      this.row('Operations', 'Vint Cerf', 7 * GB, 25 * GB, daysAgo(60), 1300, 75)
    ];
    return rows;
  }

  public async getGroupGovernance(): Promise<IGroupGovernance[]> {
    const tenant = 'https://contoso.sharepoint.com';
    return [
      this.group('Marketing', tenant, 3, 0),
      this.group('Sales', tenant, 2, 4), // external guests
      this.group('HR', tenant, 2, 0),
      this.group('Finance-Archive', tenant, 1, 0), // single point of failure
      this.group('ProjectApollo', tenant, 0, 2), // orphaned + guests
      this.group('Legal', tenant, 2, 0),
      this.group('IT-Helpdesk', tenant, 4, 0),
      this.group('Comms', tenant, 1, 0), // single owner
      this.group('VendorPortal', tenant, 2, 9), // many guests
      this.group('OldIntranet', tenant, 0, 0), // orphaned + inactive
      this.group('R-and-D', tenant, 3, 1),
      this.group('Operations', tenant, 2, 0)
    ];
  }

  private row(
    name: string,
    owner: string,
    used: number,
    allocated: number,
    lastActivity: string,
    pageViews: number,
    activeFiles: number
  ): ISiteUsageRow {
    return {
      siteId: `mock-${name.toLowerCase()}`,
      siteUrl: `https://contoso.sharepoint.com/sites/${name}`,
      ownerDisplayName: owner,
      ownerPrincipalName: `${owner.split(' ')[0].toLowerCase()}@contoso.com`,
      isDeleted: false,
      lastActivityDate: lastActivity || undefined,
      fileCount: Math.round(used / (1024 * 1024 * 4)),
      activeFileCount: activeFiles,
      pageViewCount: pageViews,
      storageUsedInBytes: Math.round(used),
      storageAllocatedInBytes: Math.round(allocated),
      rootWebTemplate: 'Group'
    };
  }

  private group(name: string, tenant: string, ownerCount: number, guestCount: number): IGroupGovernance {
    return {
      groupId: `mock-g-${name.toLowerCase()}`,
      displayName: name,
      webUrl: `${tenant}/sites/${name}`,
      ownerCount,
      guestCount
    };
  }
}
