import { Component } from 'react';

/**
 * This abstract class is a base for any sub component of a tabbed GUI
 * We use a boolean variable to track whether the component is mounted,
 * and prevent modifying state of non-mounted components in callbacks to avoid memory leaks
 */
abstract class TabbedComponent<P = {}, S = {}> extends Component<P, S> {
  protected _isMounted: boolean;

  public constructor(props: any) {
    super(props);
  }

  public componentWillUnmount() {
    this._isMounted = false;
  }

  public getMountedState() {
    return this._isMounted;
  }
}

export default TabbedComponent;
