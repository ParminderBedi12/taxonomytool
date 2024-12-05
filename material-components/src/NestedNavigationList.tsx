import { List, ListItemIcon, ListItemText, ListItem, Collapse, withStyles, WithStyles, Typography } from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import React from 'react';
import { navigationList } from './styles';

interface NestedNavigationListProps extends WithStyles<typeof navigationList> {
  /** The text of the collapsible parent element */
  text: string;

  /** Element to render in the list menu */
  icon?: React.ReactElement<any>;

  /** used to control the submenus given the state of a drawer */
  drawerOpen: boolean;
}

interface NestedNavigationListState {
  open: boolean;
}

type ParentItemProps = WithStyles<typeof navigationList> & Pick<NestedNavigationListProps, 'icon' | 'text'> & { onClick: () => void; open: boolean; drawerOpen: boolean };

/**
 * The parent Item list componant, can use an icon or none. Will compact when the drawerOpen is false
 * @param props
 */
function ParentItemComponent(props: ParentItemProps) {
  const { classes, icon, onClick, open, text, drawerOpen } = props;
  const iconExists = !!icon;
  const textItem = <Typography className={classes.listItemParentText}>{text}</Typography>;
  return (
    <Collapse in={drawerOpen} timeout="auto" unmountOnExit={true}>
      <ListItem button={true} disableGutters={iconExists /* to control padding */} onClick={onClick} classes={{ selected: classes.selected, root: classes.listItem }}>
        {icon && <ListItemIcon className={classes.icon}>{icon}</ListItemIcon>}
        <ListItemText primary={textItem} />
        <ListItemIcon className={classes.icon}>{open ? <ExpandLess /> : <ExpandMore />}</ListItemIcon>
      </ListItem>
    </Collapse>
  );
}

const ParentItem = withStyles(navigationList)(ParentItemComponent);

class NestedNavigationListComponent extends React.Component<NestedNavigationListProps, NestedNavigationListState> {
  constructor(props: NestedNavigationListProps) {
    super(props);
    this.state = {
      open: true,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  private handleClick(): void {
    const nextState = !this.state.open;
    this.setState({ open: nextState });
  }

  public render() {
    const { open } = this.state;
    const { classes, children, icon, text, drawerOpen } = this.props;

    const forcedOpenOnDrawerClose = drawerOpen ? open : true;
    return (
      <List className={classes.root}>
        <ParentItem onClick={this.handleClick} icon={icon} open={forcedOpenOnDrawerClose} text={text} drawerOpen={drawerOpen} />
        <Collapse in={forcedOpenOnDrawerClose} timeout="auto" unmountOnExit={true}>
          {children}
        </Collapse>
      </List>
    );
  }
}

export default withStyles(navigationList)(NestedNavigationListComponent);
