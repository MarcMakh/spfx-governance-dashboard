import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IGraphService } from './IGraphService';
import { ISiteUsageRow, IGroupGovernance, UsagePeriod } from './GraphTypes';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface IBatchRequest {
  id: string;
  url: string;
}

interface IBatchResponse {
  id: string;
  status: number;
  body: any;
}

/**
 * Live Microsoft Graph implementation.
 *
 * Required application/delegated scopes (declared in package-solution.json and
 * granted from the SharePoint admin "API access" page):
 *   Reports.Read.All, Sites.Read.All, Group.Read.All, GroupMember.Read.All, User.Read.All
 */
export class GraphService implements IGraphService {
  private static readonly BATCH_SIZE = 20;

  constructor(private readonly client: MSGraphClientV3) {}

  /**
   * Reads the SharePoint site usage detail report as JSON and pages through it.
   * Deleted sites are filtered out so they never appear as governance noise.
   */
  public async getSiteUsage(period: UsagePeriod): Promise<ISiteUsageRow[]> {
    const rows: ISiteUsageRow[] = [];
    let next: string | undefined =
      `/reports/getSharePointSiteUsageDetail(period='${period}')?$format=application/json`;

    while (next) {
      const res: any = await this.client.api(next).version('v1.0').get();
      const value: any[] = (res && res.value) || [];
      for (const r of value) {
        rows.push(this.mapUsageRow(r));
      }
      next = res && res['@odata.nextLink'] ? (res['@odata.nextLink'] as string) : undefined;
    }

    return rows.filter((r) => !r.isDeleted);
  }

  /**
   * For each Microsoft 365 (unified) group, resolves the backing site URL plus
   * owner and guest counts. Requests are issued through Graph `$batch` (20 per
   * call) to stay well inside throttling limits.
   */
  public async getGroupGovernance(maxGroups: number = 200): Promise<IGroupGovernance[]> {
    const groups = await this.listUnifiedGroups(maxGroups);

    const requests: IBatchRequest[] = [];
    groups.forEach((g, i) => {
      requests.push({ id: `site_${i}`, url: `/groups/${g.id}/sites/root?$select=webUrl` });
      requests.push({ id: `owners_${i}`, url: `/groups/${g.id}/owners?$select=id&$top=100` });
      requests.push({ id: `members_${i}`, url: `/groups/${g.id}/members?$select=id,userType&$top=999` });
    });

    const responses = await this.batch(requests);

    return groups.map((g, i) => {
      const site = responses[`site_${i}`];
      const owners = responses[`owners_${i}`];
      const members = responses[`members_${i}`];

      const webUrl = site && site.status === 200 ? site.body?.webUrl : undefined;
      const ownerCount = owners && owners.status === 200 ? (owners.body?.value || []).length : 0;
      const guestCount =
        members && members.status === 200
          ? (members.body?.value || []).filter((m: any) => m.userType === 'Guest').length
          : 0;

      return { groupId: g.id, displayName: g.displayName, webUrl, ownerCount, guestCount };
    });
  }

  private async listUnifiedGroups(maxGroups: number): Promise<{ id: string; displayName: string }[]> {
    const groups: { id: string; displayName: string }[] = [];
    let next: string | undefined =
      `/groups?$filter=${encodeURIComponent("groupTypes/any(c:c eq 'Unified')")}&$select=id,displayName&$top=100`;

    while (next && groups.length < maxGroups) {
      const res: any = await this.client.api(next).version('v1.0').get();
      for (const g of (res.value || []) as any[]) {
        groups.push({ id: g.id, displayName: g.displayName });
      }
      next = res && res['@odata.nextLink'] ? (res['@odata.nextLink'] as string) : undefined;
    }

    return groups.slice(0, maxGroups);
  }

  private async batch(requests: IBatchRequest[]): Promise<Record<string, IBatchResponse>> {
    const out: Record<string, IBatchResponse> = {};

    for (let i = 0; i < requests.length; i += GraphService.BATCH_SIZE) {
      const chunk = requests.slice(i, i + GraphService.BATCH_SIZE).map((r) => ({
        id: r.id,
        method: 'GET',
        url: r.url
      }));

      const res: any = await this.client.api('/$batch').version('v1.0').post({ requests: chunk });
      for (const r of (res.responses || []) as IBatchResponse[]) {
        out[r.id] = r;
      }
    }

    return out;
  }

  private mapUsageRow(r: any): ISiteUsageRow {
    return {
      siteId: r.siteId,
      siteUrl: r.siteUrl,
      ownerDisplayName: r.ownerDisplayName || '',
      ownerPrincipalName: r.ownerPrincipalName,
      isDeleted: r.isDeleted === true || r.isDeleted === 'True',
      lastActivityDate: r.lastActivityDate || undefined,
      fileCount: Number(r.fileCount) || 0,
      activeFileCount: Number(r.activeFileCount) || 0,
      pageViewCount: Number(r.pageViewCount) || 0,
      storageUsedInBytes: Number(r.storageUsedInBytes) || 0,
      storageAllocatedInBytes: Number(r.storageAllocatedInBytes) || 0,
      rootWebTemplate: r.rootWebTemplate
    };
  }
}
