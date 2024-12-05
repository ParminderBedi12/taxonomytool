import { withStyles } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import MaterialUiIconButton from '@material-ui/core/IconButton';
import MaterialUiToolbar, { ToolbarProps as MuiToolbarProps } from '@material-ui/core/Toolbar';
import MenuOutlinedIcon from '@material-ui/icons/MenuOutlined';
import React, { ReactElement } from 'react';
import { drawerMenuIcon } from './styles';
import AppBar from './AppBar';
import ToolbarMenu from './ToolbarMenu';

interface DrawerIconProps {
  onDrawerIconClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface ToolbarProps extends DrawerIconProps, MuiToolbarProps {
  logo?: ReactElement<any>;
  imageUrl?: string;
  menuTitle?: string;
  onAvatarIconClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  showDrawerIcon?: boolean;
  title?: string;
  userName: string;
}

interface ToolbarState {
  menuAnchor?: HTMLElement;
  menuOpen: boolean;
}

const IconButton = withStyles(drawerMenuIcon)(MaterialUiIconButton);

/**
 * Content for top AppBar with optional drawer icon; app header and avatar icon.
 */
class TopAppBar extends React.Component<ToolbarProps, ToolbarState, {}> {
  drawerIcon: any;
  constructor(props: ToolbarProps) {
    super(props);
    this.state = {
      menuOpen: false,
    };
    this.drawerIcon = (
      <IconButton color="default" onClick={props.onDrawerIconClick}>
        <MenuOutlinedIcon />
      </IconButton>
    );
  }

  public render() {
    const { imageUrl, logo, menuTitle, onAvatarIconClick, userName } = this.props;
    return (
      <AppBar>
        <MaterialUiToolbar disableGutters={true}>
          {this.drawerIcon}
          {<span style={{ width: 24 }} />}
          {logo}
          <div style={{ flexGrow: 1 }} />
          <Divider orientation="vertical" flexItem={true} />
          <ToolbarMenu tooltipTitle={menuTitle || ''} imageUrl={imageUrl} userName={userName} onClick={onAvatarIconClick} />
        </MaterialUiToolbar>
        <Divider flexItem={false} />
      </AppBar>
    );
  }
}

export default TopAppBar;
