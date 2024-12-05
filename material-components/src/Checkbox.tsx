import { withStyles } from '@material-ui/core';
import MuiCheckbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import React from 'react';
import { checkbox } from './styles';

/**
 * Checkbox with custom styling
 * @param props Standard CheckboxProps from Material UI
 */
const Checkbox: React.FunctionComponent<CheckboxProps> = (props: CheckboxProps) => {
  return <MuiCheckbox {...props} />;
};

export default withStyles(checkbox)(Checkbox);
