# Analytics

This is a React wrapper for using the [analytics](https://www.npmjs.com/package/analytics) library. The `AnalyticsProvider` component expects an `Analytics` instance provided to the `analytics` prop.

```JSX
<AnalyticsProvider analytics={Analytics({
  app: 'my-awesome-app',
  plugins: []
})}>
  {/*...*/}
</AnalyticsProvider>
```

The `AnalyticsConsumer` component expects a child function which accepts these parameters:

- `analytics`: The instance provided to `AnalyticsProvider`
- `track`: A function that calls `analytics.track` with the properties provided to the `eventProperties` prop.
- `instrument`: A function that wraps the provided function with `track`.

Example:

```JSX
<AnalyticsConsumer eventProperties={{confirm: true}}>
  {({logEvent}) => <button onClick={() => logEvent('click')} />}
</AnalyticsConsumer>
```
