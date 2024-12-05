import { withTheme, WithTheme as WithThemeProps } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import AccountBox from '@material-ui/icons/AccountBox';
import React from 'react';

interface ToolbarMenuProps extends WithThemeProps {
  imageUrl?: string | undefined;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  tooltipTitle: string;
  userName: string;
}

const avatarStyles = {
  height: 32,
  width: 32,
};

/**
 * Toolbar with avatar icon for use in top app bar.
 * @param props
 */
const ToolbarMenu: React.FunctionComponent<ToolbarMenuProps> = (props: ToolbarMenuProps) => {
  const { onClick, imageUrl, tooltipTitle, userName } = props;
  const divStyles = { paddingLeft: '8px', paddingRight: '8px', color: props.theme.palette.text.primary, fontSize: '14px' };
  let icon;
  if (imageUrl) {
    icon = <Avatar variant="rounded" style={avatarStyles} src={imageUrl} />;
  } else {
    icon = <AccountBox style={avatarStyles} />;
  }
  return (
    <Tooltip title={tooltipTitle}>
      <IconButton
        aria-haspopup="true"
        onClick={onClick}
        color="inherit"
        disableRipple={true}
        disableFocusRipple={true}
        focusRipple={false}
        // This style is the easiest way to disable the default button hover behavior
        style={{ backgroundColor: 'transparent' }}
      >
        {icon}
        <div style={divStyles}>{userName}</div>
      </IconButton>
    </Tooltip>
  );
};

export default withTheme(ToolbarMenu);
