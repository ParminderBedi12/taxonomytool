import { Typography } from '@material-ui/core';
import React, { Fragment } from 'react';

/**
 * Simple page for non-existant routes
 */
class NotFound extends React.Component<{}, {}> {
  public render() {
    return (
      <Fragment>
        <Typography variant="h1">Oops!</Typography>
        <Typography variant="h3">We can't seem to find the page you are looking for.</Typography>
      </Fragment>
    );
  }
}

export default NotFound;
