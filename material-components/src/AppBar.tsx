import { AppBar as MaterialUiAppBar, withStyles, WithStyles } from '@material-ui/core';
import React from 'react';
import { appBar } from './styles';

interface AppBarProps extends WithStyles<typeof appBar> {}

/**
 * A styled AppBar with awareness of Drawer state.
 */
const AppBar: React.FunctionComponent<AppBarProps> = (props: AppBarProps) => {
  const { classes, ...rest } = props;
  const { ...baseClasses } = classes;
  return <MaterialUiAppBar elevation={0} classes={baseClasses} {...rest} />;
};

export default withStyles(appBar)(AppBar);
