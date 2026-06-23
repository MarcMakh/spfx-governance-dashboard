# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-06-22

### Added
- Initial release of the SharePoint Governance Dashboard SPFx web part.
- Microsoft Graph integration via `MSGraphClientV3` with `$batch` for ownership signals.
- Governance rules engine for stale / inactive sites, storage pressure, orphaned sites,
  single-owner risk, and external (guest) access — all threshold-driven.
- Fluent UI dashboard: summary cards, category filters, searchable sortable site table.
- Property pane configuration for data source and all thresholds.
- `MockGraphService` sample-data mode for tenant-free demos.
- Jest unit tests covering the rules engine.
- GitHub Actions CI building and testing on Node 18.
