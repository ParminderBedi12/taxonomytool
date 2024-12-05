import { withStyles } from '@material-ui/core';
import { default as MaterialUiDrawer, DrawerProps as MuiDrawerProps } from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import MenuLeft from '@material-ui/icons/Menu';
import classNames from 'classnames';
import React from 'react';
import { drawer as drawerStyles, DrawerClassKey } from './styles';

interface DrawerProps extends MuiDrawerProps {
  classes: Partial<Record<DrawerClassKey, string>>;
  open: boolean;
}

export class DrawerContext {
  // Whether the drawer is open
  public open: boolean = false;
}

export const { Consumer: DrawerContextConsumer, Provider: DrawerContextProvider } = React.createContext(new DrawerContext());

/**
 * A styled Drawer with awareness of open/closed state.
 */
const Drawer: React.FunctionComponent<DrawerProps> = (props: DrawerProps) => {
  const { children, classes, open, ...rest } = props;
  const { drawerMenuIcon, paperClosed, paperOpen, toolbarHeader, paper, inner } = classes;
  const className = classNames(open ? paperOpen : paperClosed);
  return (
    <MaterialUiDrawer open={open} className={className} classes={{ paper }} {...rest}>
      <DrawerContextProvider value={{ open: open === true }}>
        <div className={toolbarHeader}>
          <IconButton className={drawerMenuIcon as any}>
            <MenuLeft />
          </IconButton>
        </div>
        <div className={inner}>{children}</div>
      </DrawerContextProvider>
    </MaterialUiDrawer>
  );
};

export default withStyles(drawerStyles)(Drawer) as any;
