interface AmplitudeAnalyticsPluginConfig {
  apiKey: string;
  options?: Record<string, any>;
  initialSessionId?: string;
}

declare module '@analytics/amplitude' {
  export default function amplitudePlugin(config: AmplitudeAnalyticsPluginConfig): import('analytics').AnalyticsPlugin;
}
