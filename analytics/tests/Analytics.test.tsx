import { render, screen } from '@testing-library/react';
import { Analytics } from 'analytics';
import React from 'react';
import { AnalyticsConsumer, AnalyticsProvider, LogOnMount } from '../src/Analytics';

describe('<AnalyticsProvider />', () => {
  test('should provide an Analytics context', async () => {
    const analyticsInstance = Analytics({
      app: 'test',
    });
    const spy = jest.spyOn(analyticsInstance, 'track');
    render(
      <AnalyticsProvider analytics={analyticsInstance}>
        <AnalyticsConsumer>
          {({ analytics }) => {
            analytics.track('test event!', {});
            return null;
          }}
        </AnalyticsConsumer>
      </AnalyticsProvider>,
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('<AnalyticsConsumer />', () => {
  test('should track using event properties prop', async () => {
    const analyticsInstance = Analytics({
      app: 'test',
    });
    const spy = jest.spyOn(analyticsInstance, 'track');
    render(
      <AnalyticsProvider analytics={analyticsInstance}>
        <AnalyticsConsumer eventProperties={{ foo: 'bar' }}>
          {({ track }) => {
            track('test event properties prop');
            return <div>children</div>;
          }}
        </AnalyticsConsumer>
      </AnalyticsProvider>,
    );
    const text = screen.getByText('children');
    expect(text).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith('test event properties prop', { foo: 'bar' });
  });
});

describe('<AnalyticsConsumer />', () => {
  test('should override instrument with event properties prop', async () => {
    const analyticsInstance = Analytics({
      app: 'test',
    });
    const spy = jest.spyOn(analyticsInstance, 'track');

    class Component extends React.Component<any> {
      fn: Function;

      constructor(props: any) {
        super(props);
        const { instrument }: { instrument: any } = props;
        // test instrument override
        this.fn = instrument(() => {}, 'test instrument override', { qux: 'baz' });
      }

      public render() {
        this.fn();
        return <div>child element</div>;
      }
    }

    render(
      <AnalyticsProvider analytics={analyticsInstance}>
        <AnalyticsConsumer eventProperties={{ foo: 'bar' }}>{({ instrument }) => <Component instrument={instrument} />}</AnalyticsConsumer>
      </AnalyticsProvider>,
    );
    const text = screen.getByText('child element');
    expect(text).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith('test instrument override', { foo: 'bar', qux: 'baz' });
  });
});

describe('<AnalyticsConsumer />', () => {
  test('should provide identity prop value to `identify` function', async () => {
    const analyticsInstance = Analytics({
      app: 'test',
    });
    const spy = jest.spyOn(analyticsInstance, 'identify');
    class TestClass {
      callbackFn() {}
    }
    const instance = new TestClass();
    render(
      <AnalyticsProvider analytics={analyticsInstance}>
        <AnalyticsConsumer
          identity={{
            userId: 'test',
            traits: { email: 'test@test.com' },
            options: {
              plugins: {
                // disable this specific identify in all plugins except customerio
                all: true,
                'google-analytics': false,
              },
            },
            callback: instance.callbackFn,
          }}
        >
          {() => <div />}
        </AnalyticsConsumer>
      </AnalyticsProvider>,
    );
    expect(spy).toHaveBeenCalledWith(
      'test',
      { email: 'test@test.com' },
      {
        plugins: {
          // disable this specific identify in all plugins except customerio
          all: true,
          'google-analytics': false,
        },
      },
      instance.callbackFn,
    );
  });
});

describe('<LogOnMount />', () => {
  test('should track event on mount', async () => {
    const analyticsInstance = Analytics({
      app: 'test',
    });
    const spy = jest.spyOn(analyticsInstance, 'track');
    render(
      <AnalyticsProvider analytics={analyticsInstance}>
        <LogOnMount eventName="test">
          <div>logonmount children</div>
        </LogOnMount>
      </AnalyticsProvider>,
    );
    const text = screen.getByText('logonmount children');
    expect(text).toBeInTheDocument();
    expect(spy).toHaveBeenNthCalledWith(1, 'test');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
