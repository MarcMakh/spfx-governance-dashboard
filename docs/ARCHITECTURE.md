# Architecture

This document explains how the SharePoint Governance Dashboard is put together and why.

## Layers

```
Web part shell  →  React UI  →  Service abstraction  →  Microsoft Graph
                       │
                       └──────→  GovernanceAnalyzer (pure rules engine)
```

### 1. Web part shell — `GovernanceDashboardWebPart.ts`

Responsible only for SPFx concerns:

- Renders the React root and disposes it cleanly (`onDispose`).
- Builds the **property pane** (data-source group + thresholds group).
- Reacts to **theme changes** and forwards `isDarkTheme`.
- **Dependency injection:** exposes a `serviceProvider` callback that returns either a live `GraphService` (built from `context.msGraphClientFactory`) or the `MockGraphService`, based on the `useSampleData` property. The UI never knows which one it received.

### 2. React UI — `components/`

Functional components with hooks and Fluent UI v8.

- `GovernanceDashboard.tsx` owns the data lifecycle: it calls the service in a `useEffect`, hands the raw results to `GovernanceAnalyzer`, and stores the analysed sites + summary in state. A cancellation flag prevents state updates after unmount, and a `refreshKey` drives manual refresh.
- The effect depends on **primitive inputs only** (period, maxGroups, a serialized thresholds key, the sample-data flag, refresh counter). The `serviceProvider` is read from a ref so unrelated parent re-renders don't trigger refetches.
- Presentation is split into `SummaryCards`, `HealthFilters`, and `SiteHealthTable`.

### 3. Service abstraction — `services/`

`IGraphService` defines the two calls the dashboard needs:

```ts
getSiteUsage(period): Promise<ISiteUsageRow[]>
getGroupGovernance(maxGroups?): Promise<IGroupGovernance[]>
```

- **`GraphService`** uses `MSGraphClientV3`. The usage report is read as JSON (`$format=application/json`) with `@odata.nextLink` paging. Ownership/guest signals are gathered with Graph **`$batch`** (chunks of 20) to minimise round-trips and throttling.
- **`MockGraphService`** returns a curated dataset covering every governance flag, so the web part is demoable without admin consent.

### 4. Rules engine — `GovernanceAnalyzer`

A static, side-effect-free class. It:

1. Indexes group governance by normalised site URL (case-insensitive, trailing slash removed).
2. Joins each usage row to its group (when one exists).
3. Applies the configured thresholds to produce `GovernanceFlag[]` and an overall `HealthSeverity`.
4. Aggregates the tenant-wide `IGovernanceSummary`.

Because it is pure and accepts an injectable `asOf` date, the entire governance policy is deterministic and unit tested.

## Why split it this way?

- **Testability** — the logic that matters (the rules) runs in milliseconds under Jest with no SharePoint toolchain.
- **Reviewability** — a hiring manager or admin can run the web part with sample data and read the rules in one file.
- **Swappability** — the same UI could be pointed at PnPjs, a cached API, or a different report simply by implementing `IGraphService`.

## Data sources

| Call | Endpoint |
| --- | --- |
| Site usage | `GET /v1.0/reports/getSharePointSiteUsageDetail(period='{D7\|D30\|D90\|D180}')?$format=application/json` |
| Groups | `GET /v1.0/groups?$filter=groupTypes/any(c:c eq 'Unified')&$select=id,displayName` |
| Backing site | `GET /v1.0/groups/{id}/sites/root?$select=webUrl` |
| Owners | `GET /v1.0/groups/{id}/owners?$select=id` |
| Members (guests) | `GET /v1.0/groups/{id}/members?$select=id,userType` |
