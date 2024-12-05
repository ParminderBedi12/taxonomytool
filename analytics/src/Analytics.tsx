import Analytics, { AnalyticsInstance } from 'analytics';
import React from 'react';

interface EventProperties extends Record<string, any> {}

type Identity = { userId: string; traits?: any; options?: any; callback?: (...params: any[]) => any };
type Instrument = (fn: (...args: any[]) => any, eventName: string, properties?: EventProperties) => (...args: any[]) => any;
type TrackFunction = (eventName: string, properties?: EventProperties) => void;

interface AnalyticsContextValue {
  /** Context shared Analytics instance. */
  analytics: AnalyticsInstance;

  /** Wraps a provided function with an event tracker for the given event name and properties. */
  instrument: Instrument;

  /** A function that calls `track` on the context Analytics instance. */
  track: TrackFunction;
}

interface AnalyticsProviderProps {
  /** Context shared Analytics instance. */
  analytics: AnalyticsInstance;
}

interface LogOnMountProps extends React.PropsWithChildren<{}> {
  /** The tracked event name */
  eventName: string;
}

interface AnalyticsConsumerProps extends React.ConsumerProps<AnalyticsContextValue> {
  /** An object which is merged with the properties provided for `track` and `instrument`. It does not affect the shared `analytics` object. */
  eventProperties?: EventProperties;

  /** Prop allowing for setting user properties. Same behavior as calling `analytics.identify()` without response */
  identity?: Identity;
}

const defaultAnalytics = Analytics({});

const analyticsContext = React.createContext<AnalyticsContextValue>({
  analytics: defaultAnalytics,
  instrument: (fn, eventName, properties) => {
    defaultAnalytics.track(eventName, properties);
    return fn;
  },
  track: defaultAnalytics.track,
});

const { Provider } = analyticsContext;

/**
 * Shares an instance of {@link Analytics} and helper functions.
 *
 * @param analytics The instance of {@link Analytics}
 * @returns
 */
const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ analytics, children }) => {
  const instrument = (fn: (...args: any[]) => any, eventName: string, properties?: EventProperties) => {
    return (...args: any[]) => {
      analytics.track(eventName, properties);
      fn(args);
    };
  };

  const track = (eventName: string, properties?: EventProperties) => {
    analytics.track(eventName, properties);
  };

  return <Provider value={{ analytics, instrument, track }}>{children}</Provider>;
};

/**
 * Component that calls `track` function on parent analytics object.
 */
class LogOnMount extends React.Component<LogOnMountProps> {
  static contextType = analyticsContext;

  public componentDidMount() {
    const { props } = this;
    const { analytics }: { analytics: AnalyticsInstance } = this.context;
    analytics.track(props.eventName);
  }

  public render() {
    const { props } = this;
    return <React.Fragment>{props.children}</React.Fragment>;
  }
}

/**
 * Consumes the analytics context and accepts an `eventProperties` prop for default event values.
 *
 * @example
 * <AnalyticsConsumer eventProperties={{confirm: true}}>
 *   {({logEvent}) => <button onClick={() => logEvent('click')} />}
 * </AnalyticsConsumer>
 */
class AnalyticsConsumer extends React.Component<AnalyticsConsumerProps> {
  static contextType = analyticsContext;

  public componentDidMount() {
    const { identity } = this.props;
    const { context }: { context: AnalyticsContextValue } = this;
    const analytics = context.analytics;
    if (identity) {
      const { userId, traits, options, callback } = identity;
      analytics.identify(userId, traits, options, callback);
    }
  }

  public render() {
    const { children } = this.props;
    const { context }: { context: AnalyticsContextValue } = this;
    const contextOverride: AnalyticsContextValue = {
      analytics: context.analytics,
      instrument: this.makeInstrumentOverride(),
      track: this.makeTrackFunctionOverride(),
    };
    return children(contextOverride);
  }

  /**
   * Creates a wrapped function that also calls track using the provided properties and the `eventProperties` prop value.
   * @returns Wrapped function
   */
  makeInstrumentOverride = (): Instrument => {
    const trackOverride = this.makeTrackFunctionOverride();
    return (fn: (...args: any[]) => any, eventName: string, properties?: EventProperties) => {
      return (...args: any[]) => {
        trackOverride(eventName, properties);
        fn(...args);
      };
    };
  };

  /**
   * Creates a wrapped analytics tracker function that merges in `eventProperties` prop value.
   * @returns Wrapped analytics tracker function
   */
  makeTrackFunctionOverride = (): TrackFunction => {
    const { context }: { context: AnalyticsContextValue } = this;
    const { eventProperties: defaultEventProperties } = this.props;
    const analytics = context.analytics;
    return (eventName: string, eventProperties?: EventProperties) => {
      analytics.track(eventName, { ...eventProperties, ...defaultEventProperties });
    };
  };
}

export { AnalyticsConsumer, AnalyticsProvider, LogOnMount };
