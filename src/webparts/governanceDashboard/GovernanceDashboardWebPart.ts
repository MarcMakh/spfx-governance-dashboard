import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneDropdown,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'GovernanceDashboardWebPartStrings';
import GovernanceDashboard from './components/GovernanceDashboard';
import { IGovernanceDashboardProps } from './components/IGovernanceDashboardProps';
import { GraphService } from './services/GraphService';
import { MockGraphService } from './services/MockGraphService';
import { IGraphService } from './services/IGraphService';
import { UsagePeriod } from './services/GraphTypes';
import { DEFAULT_THRESHOLDS } from './models';

export interface IGovernanceDashboardWebPartProps {
  title: string;
  useSampleData: boolean;
  usagePeriod: UsagePeriod;
  maxGroups: number;
  staleDays: number;
  inactiveDays: number;
  storageWarnPercent: number;
  storageCriticalPercent: number;
  minOwners: number;
}

export default class GovernanceDashboardWebPart extends BaseClientSideWebPart<IGovernanceDashboardWebPartProps> {
  private _isDarkTheme: boolean = false;

  public render(): void {
    const element: React.ReactElement<IGovernanceDashboardProps> = React.createElement(
      GovernanceDashboard,
      {
        title: this.properties.title || 'SharePoint Governance Dashboard',
        usagePeriod: this.properties.usagePeriod || 'D30',
        maxGroups: this.properties.maxGroups || 200,
        useSampleData: this.properties.useSampleData,
        thresholds: {
          staleDays: this.properties.staleDays ?? DEFAULT_THRESHOLDS.staleDays,
          inactiveDays: this.properties.inactiveDays ?? DEFAULT_THRESHOLDS.inactiveDays,
          storageWarnPercent: this.properties.storageWarnPercent ?? DEFAULT_THRESHOLDS.storageWarnPercent,
          storageCriticalPercent:
            this.properties.storageCriticalPercent ?? DEFAULT_THRESHOLDS.storageCriticalPercent,
          minOwners: this.properties.minOwners ?? DEFAULT_THRESHOLDS.minOwners
        },
        isDarkTheme: this._isDarkTheme,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        serviceProvider: async (): Promise<IGraphService> => {
          if (this.properties.useSampleData) {
            return new MockGraphService();
          }
          const client = await this.context.msGraphClientFactory.getClient('3');
          return new GraphService(client);
        }
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }
    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;
    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.DataSourceGroupName,
              groupFields: [
                PropertyPaneTextField('title', { label: strings.TitleFieldLabel }),
                PropertyPaneToggle('useSampleData', { label: strings.UseSampleDataLabel }),
                PropertyPaneDropdown('usagePeriod', {
                  label: strings.UsagePeriodLabel,
                  options: [
                    { key: 'D7', text: 'Last 7 days' },
                    { key: 'D30', text: 'Last 30 days' },
                    { key: 'D90', text: 'Last 90 days' },
                    { key: 'D180', text: 'Last 180 days' }
                  ]
                }),
                PropertyPaneSlider('maxGroups', {
                  label: strings.MaxGroupsLabel,
                  min: 20,
                  max: 500,
                  step: 20
                })
              ]
            },
            {
              groupName: strings.ThresholdsGroupName,
              groupFields: [
                PropertyPaneSlider('staleDays', {
                  label: strings.StaleDaysLabel,
                  min: 30,
                  max: 365,
                  step: 5
                }),
                PropertyPaneSlider('inactiveDays', {
                  label: strings.InactiveDaysLabel,
                  min: 60,
                  max: 730,
                  step: 5
                }),
                PropertyPaneSlider('storageWarnPercent', {
                  label: strings.StorageWarnLabel,
                  min: 50,
                  max: 95,
                  step: 1
                }),
                PropertyPaneSlider('storageCriticalPercent', {
                  label: strings.StorageCriticalLabel,
                  min: 60,
                  max: 100,
                  step: 1
                }),
                PropertyPaneSlider('minOwners', {
                  label: strings.MinOwnersLabel,
                  min: 1,
                  max: 5,
                  step: 1
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
