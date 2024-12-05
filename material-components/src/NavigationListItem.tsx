import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles, WithStyles } from '@material-ui/core';
import React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';
import { navigationList } from './styles';
import { DrawerContext, DrawerContextConsumer } from './Drawer';

export interface NavigationListItemProps extends RouteComponentProps, WithStyles<typeof navigationList> {
  /** Whether the link is to an external location. Uses an anchor element instead of Link */
  external?: boolean;

  /** Element to render in the list menu */
  icon: React.ReactElement<any>;

  nested?: boolean;

  /** Text in the list menu */
  primaryText: string;

  /** The relative destination for in-app URLs, absolute if external */
  to: string;
}

function renderContent(
  classes: NavigationListItemProps['classes'],
  nested: NavigationListItemProps['nested'],
  icon: NavigationListItemProps['icon'],
  primaryText: NavigationListItemProps['primaryText'],
  selected: boolean,
) {
  return (
    <React.Fragment>
      {nested === true ? (
        <DrawerContextConsumer>
          {(context: DrawerContext) => <ListItemIcon className={`${classes.icon} ${context.open ? classes.iconNestedExpanded : classes.iconNestedCompact}`}>{icon}</ListItemIcon>}
        </DrawerContextConsumer>
      ) : (
        <ListItemIcon className={`${selected ? classes.iconHighlight : classes.icon}`}>{icon}</ListItemIcon>
      )}
      <ListItemText primary={primaryText} />
    </React.Fragment>
  );
}

/**
 * ListItem styled so that icons align with the top Drawer menu button in NavigationList.
 */
const NavigationListItemComponent: React.FunctionComponent<NavigationListItemProps> = (props: NavigationListItemProps) => {
  const { classes, external, icon, location, nested, primaryText, to } = props;

  // Render a simple href for external links
  if (external === true) {
    return (
      <ListItem component="a" button={true} disableGutters={true /* to control padding */} selected={false} href={to} target="_blank" className={classes.listItemLink}>
        {renderContent(classes, nested, icon, primaryText, false)}
      </ListItem>
    );
  } else {
    class LinkComponent extends React.PureComponent<any> {
      public render() {
        const componentProps = this.props;
        return <Link to={to} {...componentProps} />;
      }
    }

    let selected = false;
    if (location.pathname === to) {
      selected = true;
    }
    return (
      <ListItem component={LinkComponent} button={true} disableGutters={true /* to control padding */} className={`${selected ? classes.selected : classes.listItem}`}>
        {renderContent(classes, nested, icon, primaryText, selected)}
      </ListItem>
    );
  }
};

const NavigationListItem: any = withRouter(withStyles(navigationList)(NavigationListItemComponent));

export default NavigationListItem;
