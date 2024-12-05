import { StyledProps, Theme, useTheme, withStyles } from '@material-ui/core';
import { default as Input, InputProps } from '@material-ui/core/Input';
import { InputBaseComponentProps } from '@material-ui/core/InputBase';
import MenuItem from '@material-ui/core/MenuItem';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import debounce from 'debounce-promise';
import React, { CSSProperties } from 'react';
import { components, IndicatorProps } from 'react-select';
import { default as AsyncSelect, Props as AsyncSelectProps } from 'react-select/async';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import { ActionMeta } from './MultiSelect';

type UsedInputProps = Pick<InputProps, 'autoFocus' | 'disabled' | 'placeholder' | 'error'>;

type UsedAsyncSelectProps = Pick<AsyncSelectProps<any>, 'loadOptions' | 'menuPortalTarget'>;

export type Option = {
  label: string;
};

export interface ISearchableSelectProps<T extends Option> extends UsedInputProps, UsedAsyncSelectProps {
  // This overrides the definition for AsyncSelect defaultOptions
  defaultOptions: T[];

  // This replaces the "onChange" prop which has conflicting types for Input and Async. This is used
  // as the "onChange" prop for Async.
  onValueChange: (value: T, action: ActionMeta<T>) => void;
}

const dropdownItemHeight = 37;
// The number of items to show in the menu before scrolling
const numItems = 5;

const customAsyncSelectStyles = {
  control: (): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    border: 0,
    height: 'auto',
    background: 'transparent',
  }),
  indicatorSeparator: (): CSSProperties => ({
    ['isDisable' as any]: true,
  }),
  'placeholder': (): CSSProperties => ({
    color: 'black',
  }),
};

const inputStyles = (theme: Theme) => {
  return {
    input: {
      fontSize: theme.typography.fontSize,
      // Required in MUI4 because the default height of input is set to '1.1875em', which causes text to be misaligned.
      height: 'auto',
    },
  };
};

// An input with styles applied so that the Async select fits
const StyledInput = withStyles(inputStyles)(Input);

function DropdownOption(props: any) {
  const theme = useTheme();
  return (
    <MenuItem
      buttonRef={props.innerRef}
      component="div"
      disableGutters={true}
      selected={props.isFocused}
      style={{
        backgroundColor: props.isFocused ? theme.palette.primary.dark : theme.palette.background.paper,
        fontSize: theme.typography.fontSize,
        fontWeight: props.isSelected ? 500 : 400,
        padding: theme.spacing(),
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

/**
 *
 * Code for menulist is using virtual-react for faster asynch lists.
 *
 */
function MenuList(props: any) {
  const childrenLengthExists = props.children instanceof Array; // react select passes a function instead of an array when there are no elements
  const childrenLength = childrenLengthExists ? props.children.length : 0;
  const theme = useTheme();
  const style: CSSProperties = { backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary };
  if (!childrenLengthExists) {
    return <div style={style}>{props.children}</div>;
  }

  return (
    <AutoSizer disableHeight={true}>
      {({ width }) => (
        <List width={width} height={dropdownItemHeight * Math.min(Math.max(childrenLength, 1), numItems)} itemCount={childrenLength} itemSize={dropdownItemHeight} style={style}>
          {({ index, style }) => {
            return <div style={style}>{props.children[index]}</div>;
          }}
        </List>
      )}
    </AutoSizer>
  );
}

const DropdownIndicator = (props: IndicatorProps<any>) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <ArrowDropDownIcon />
      </components.DropdownIndicator>
    )
  );
};

const WrappedAsyncSelect = (props: InputBaseComponentProps & Partial<StyledProps>): React.ReactElement<AsyncSelectProps<any>> => {
  const { autoFocus, className, defaultOptions, isDisabled, loadOptions, menuPortalTarget, onValueChange, placeholder } = props;
  return (
    <AsyncSelect
      autoFocus={autoFocus}
      backspaceRemovesValue={false}
      captureMenuScroll={false}
      // className is propagated from the Input component so that styles are inherited.
      className={className}
      closeMenuOnSelect={true}
      components={{ Option: DropdownOption, DropdownIndicator, MenuList }}
      isDisabled={isDisabled}
      defaultOptions={defaultOptions}
      loadOptions={loadOptions}
      onChange={onValueChange}
      placeholder={placeholder}
      styles={customAsyncSelectStyles}
      menuPortalTarget={menuPortalTarget}
      // The value is always an empty string (it's always displaying a placeholder)
      value=""
    />
  );
};

/**
 * Async select component styled to fit in with Material UI.
 *
 * The code contained here was adapted from the following resources:
 * https://material-ui.com/demos/autocomplete/
 * https://stackoverflow.com/questions/50863495/styling-react-select-v2-with-material-ui-replace-input-component
 * https://react-select.com/advanced#portaling
 *
 *
 * Example:
 * ```
 * <SearchableSelect<Option>
 *   disabled={false}
 *   placeholder={this.state.value ? this.state.value : 'Select something'}
 *   loadOptions={(inputValue: string): Promise<Option[]> => {
 *     return new Promise(resolve => {
 *       resolve(this.userCallback(inputValue));
 *     });
 *   }}
 *   defaultOptions={[{ label: 'Option 1' }, { label: 'Option 2' }]}
 *   onValueChange={(newValue: Option) => {
 *     this.setState({ value: newValue });
 *   }}
 * />
 * ```
 * @class
 */
class SearchableSelect<T extends Option> extends React.PureComponent<ISearchableSelectProps<T>, {}> {
  public render() {
    const { autoFocus, defaultOptions, disabled, loadOptions, menuPortalTarget, onValueChange, placeholder, error } = this.props;
    const loadOptionsDebounced = debounce((input: string) => loadOptions(input, () => {}), 500);

    return (
      <StyledInput
        disabled={disabled}
        fullWidth={true}
        inputComponent={WrappedAsyncSelect}
        error={error}
        inputProps={{
          autoFocus,
          defaultOptions,
          isDisabled: disabled,
          loadOptions: loadOptionsDebounced,
          onValueChange,
          placeholder,
          menuPortalTarget: menuPortalTarget ? menuPortalTarget : null,
        }}
        placeholder={placeholder}
      />
    );
  }
}

export default SearchableSelect;
