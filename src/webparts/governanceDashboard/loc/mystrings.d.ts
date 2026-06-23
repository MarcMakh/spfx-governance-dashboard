declare interface IGovernanceDashboardWebPartStrings {
  PropertyPaneDescription: string;
  DataSourceGroupName: string;
  ThresholdsGroupName: string;
  TitleFieldLabel: string;
  UseSampleDataLabel: string;
  UsagePeriodLabel: string;
  MaxGroupsLabel: string;
  StaleDaysLabel: string;
  InactiveDaysLabel: string;
  StorageWarnLabel: string;
  StorageCriticalLabel: string;
  MinOwnersLabel: string;
}

declare module 'GovernanceDashboardWebPartStrings' {
  const strings: IGovernanceDashboardWebPartStrings;
  export = strings;
}
