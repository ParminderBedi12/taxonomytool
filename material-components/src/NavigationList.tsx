import List from '@material-ui/core/List';
import React, { ReactElement } from 'react';
import { NavigationListItemProps } from './NavigationListItem';
import { navigationList } from './styles';
import { withStyles, WithStyles } from '@material-ui/core';

export interface NavigationListProps extends WithStyles<typeof navigationList> {
  children: ReactElement<NavigationListItemProps>[] | ReactElement<NavigationListItemProps>; // Because the "children" type can be an array or single element 😡
}

/**
 * The base component for NavigationList; requires Router
 */
class NavigationListComponent extends React.Component<NavigationListProps> {
  constructor(props: NavigationListProps) {
    super(props);
  }

  public render() {
    const { children, classes } = this.props;
    return <List className={classes.root}>{children}</List>;
  }
}

export default withStyles(navigationList)(NavigationListComponent);
