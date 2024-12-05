import { Checkbox, MenuItem, StyledProps, Theme, useTheme, withStyles } from '@material-ui/core';
import { default as Input, InputProps } from '@material-ui/core/Input';
import { InputBaseComponentProps } from '@material-ui/core/InputBase';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import Cancel from '@material-ui/icons/Cancel';
import debounce from 'debounce-promise';
import { CSSProperties, default as React, ReactNode } from 'react';
import { components, IndicatorProps, OptionProps, OptionsType, OptionTypeBase, ValueType } from 'react-select';
import { ActionMeta as ReactSelectActionMeta } from 'react-select';
import { default as AsyncSelect, Props as AsyncSelectProps } from 'react-select/async';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';

interface Option extends OptionTypeBase {
  label: string;
}

type UsedInputProps = Pick<InputProps, 'autoFocus' | 'disabled' | 'error' | 'placeholder'>;

type UsedAsyncSelectProps<T extends Option> = Pick<AsyncSelectProps<T>, 'getOptionValue' | 'loadOptions'>;

/**
 * Props for MultiSelect
 */
export interface IMultiSelectProps<T extends Option> extends UsedInputProps, UsedAsyncSelectProps<T> {
  // Some of these are non-optional versions of inherited optional props.

  /**
   * List of options to display in dropdown menu before user input
   */
  defaultOptions: T[];

  /**
   * Number of options to display in dropdown menu
   */
  dropdownLength?: number;

  /**
   * Function to return the value for given option
   */
  getOptionValue: (option: T) => string;

  /**
   * Whether variant component props need to be passed to the WrappedAsyncSelect
   */
  isVariant?: boolean;
  /**
   * Function for variant to elevate state for variants
   */
  onClose?: () => void;
  /**
   * Function called on user selecting/deselecting/clearing options
   */
  onValueChange: (value: T[], actionMeta: ReactSelectActionMeta<T>) => void;

  /**
   * Input text which shows before user input
   */
  placeholderText?: (selectValue: Option[]) => string;

  /**
   * The option which, when selected, overrides selected options
   *
   * This should have `undefined` value to avoid this behavior
   */
  selectAllOption?: T;

  /**
   * The list of values which have been selected
   */
  value: OptionsType<T> | undefined;
}

export type ActionMeta<T> = ReactSelectActionMeta<T>;

const dropdownItemHeight = 42;

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
  input: (): CSSProperties => ({
    display: 'flex',
    padding: 0,
  }),
};

const customChipAsyncSelectStyles = {
  control: (): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    border: 0,
    height: '100%',
    background: 'transparent',
  }),
  indicatorSeparator: (): CSSProperties => ({
    ['isDisable' as any]: true,
  }),
  input: (): CSSProperties => ({
    display: 'flex',
    padding: 0,
  }),
  placeholder: (): CSSProperties => ({
    color: '#2D2926',
    backgroundColor: 'transparent',
    marginLeft: '2px',
    marginRight: '2px',
    position: 'absolute',
  }),
};

const inputStyles = (theme: Theme) => {
  return {
    input: {
      backgroundColor: theme.palette.background.paper,
      fontSize: theme.typography.fontSize,
      // Required in MUI4 because the default height of input is set to '1.1875em', which causes text to be misaligned.
      height: 'auto',
    },
  };
};

const chipInputStyles = (theme: Theme) => {
  return {
    input: {
      backgroundColor: 'transparent',
      fontSize: theme.typography.fontSize,
      height: '32px',
      zIndex: 1000, // Fixes overlay issue with dropdown going behind some elements that have 500 as their z-index
      // if viewport is below 1180px, then the alignment gets messed up again
      width: '100%',
      minWidth: '160px',
      color: theme.palette.background.default,
    },
    root: {
      backgroundColor: '#FFC72C',
      borderRadius: 52 / 2,
      height: '32px',
      color: 'black',
    },
  };
};

// An input with styles applied so that the Async select fits
const StyledInput = withStyles(inputStyles)(Input);

const ChipStyledInput = withStyles(chipInputStyles)(Input);

const DropdownIndicator = <T extends Option>(props: IndicatorProps<T>) => {
  return (
    <components.DropdownIndicator {...props}>
      <ArrowDropDown />
    </components.DropdownIndicator>
  );
};

const CancelButton = <T extends Option>(props: IndicatorProps<T>) => {
  return (
    <components.ClearIndicator {...props}>
      <Cancel fontSize="small" style={{ fill: '#2D2926' }} />
    </components.ClearIndicator>
  );
};

/**
 * Returns a component usable for MenuList component
 *
 */
function MenuList<T extends Option>(props: any) {
  const defaultDropdownLength = 10;
  const childrenLengthExists = props.children instanceof Array; // react select passes a function instead of an array when there are no elements
  const childrenLength = childrenLengthExists ? props.children.length : 0;
  const theme = useTheme();
  const height = dropdownItemHeight * Math.min(Math.max(childrenLength, 1), defaultDropdownLength);
  return (
    <AutoSizer disableHeight={true}>
      {({ width }) => (
        <List
          width={width}
          height={height}
          itemCount={childrenLength}
          itemSize={dropdownItemHeight}
          style={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.secondary,
          }}
        >
          {({ index, style }) => {
            return <div style={style}>{props.children[index]}</div>;
          }}
        </List>
      )}
    </AutoSizer>
  );
}

function WideMenuList<T extends Option>(props: any) {
  const defaultDropdownLength = 10;
  const childrenLengthExists = props.children instanceof Array; // react select passes a function instead of an array when there are no elements
  const childrenLength = childrenLengthExists ? props.children.length : 0;
  const theme = useTheme();
  const height = dropdownItemHeight * Math.min(Math.max(childrenLength, 1), defaultDropdownLength);
  const width = '400px';
  return (
    <List
      width={width}
      height={height}
      itemCount={childrenLength}
      itemSize={dropdownItemHeight}
      style={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
      }}
    >
      {({ index, style }) => {
        return <div style={style}>{props.children[index]}</div>;
      }}
    </List>
  );
}

type WrappedAsyncSelectProps<T extends Option> = InputBaseComponentProps & Partial<StyledProps> & IMultiSelectProps<T> & { children: ReactNode };

class WrappedAsyncSelect<T extends Option> extends React.PureComponent<WrappedAsyncSelectProps<T>> {
  /**
   * Wrapper that returns the default options with the selected options at the beginning of the list
   *
   * @param defaultOptions  The list of default drop down options
   * @param selectedOptions  The list of currently selected options
   */
  private sortDefaultOptions = (defaultOptions: T[], selectedOptions: T[]) => {
    const { dropdownLength, getOptionValue, selectAllOption } = this.props;
    const sliceIndex = (dropdownLength || this.props.defaultOptions.length) + 1;

    let selected: T[] = selectedOptions;
    let unselected: T[] = defaultOptions;
    const filterOutSelected = (option: T) => {
      return (
        selected.find((selectedOption) => {
          return getOptionValue(selectedOption) === getOptionValue(option);
        }) === undefined
      );
    };
    if (selectAllOption) {
      const selectAllValue = getOptionValue(selectAllOption);
      const filterOutSelectAll = (value: T) => getOptionValue(value) !== selectAllValue;

      if (selectedOptions) {
        selected = [selectAllOption, ...selectedOptions.filter(filterOutSelectAll)];
        unselected = defaultOptions.filter(filterOutSelected).slice(0, sliceIndex - selected.length);
      } else {
        selected = [selectAllOption];
        unselected = defaultOptions.slice(0, sliceIndex);
      }
    } else {
      unselected = defaultOptions.filter(filterOutSelected).slice(0, sliceIndex);
    }

    return [...selected, ...unselected];
  };

  private DropdownOption = (props: OptionProps<T>) => {
    const { getOptionValue, selectAll, selectAllOption } = this.props;
    const { isSelected } = props;
    const theme = useTheme();
    let selected = isSelected;
    if (selectAllOption) {
      if (selectAll) {
        if (getOptionValue(props.data) === getOptionValue(selectAllOption)) {
          selected = true;
        } else {
          selected = false;
        }
      }
    }
    return (
      <MenuItem
        component="div"
        onClick={props.innerProps.onClick}
        onMouseOver={props.innerProps.onMouseOver}
        selected={props.isFocused}
        style={{
          backgroundColor: props.isFocused ? theme.palette.primary.dark : theme.palette.background.paper,
          color: theme.palette.text.secondary,
          fontSize: theme.typography.fontSize,
          fontWeight: props.isSelected ? 500 : 400,
          height: dropdownItemHeight,
          paddingTop: theme.spacing(),
          paddingBottom: theme.spacing(),
          paddingLeft: 0,
        }}
      >
        <Checkbox color="primary" checked={selected} />
        {props.children}
      </MenuItem>
    );
  };

  private onChange = (value: ValueType<T>, actionMeta: ActionMeta<T>) => {
    const { getOptionValue, onValueChange, selectAllOption } = this.props;
    if (actionMeta.action === 'clear') {
      return onValueChange([], actionMeta);
    }

    if (!selectAllOption) {
      return onValueChange(value as T[], actionMeta);
    }

    const selectAllValue = getOptionValue(selectAllOption);

    if (getOptionValue(actionMeta.option as T) === selectAllValue) {
      if (actionMeta.action === 'select-option') {
        return onValueChange([selectAllOption], actionMeta); // The "select all" option was added to the value list.
      } else {
        return;
      }
    } else {
      if (actionMeta.action === 'select-option') {
        return onValueChange(
          (value as T[]).filter((value) => getOptionValue(value) !== selectAllValue),
          actionMeta,
        );
      }
      return onValueChange(value as T[], actionMeta);
    }
  };

  public render() {
    const { autoFocus, className, defaultOptions, getOptionValue, isDisabled, isVariant, loadOptions, menuIsOpen, onClose, placeholder, value } = this.props;

    const selected = value;
    const dropdown = isVariant ? null : DropdownIndicator;
    const menuList = isVariant ? WideMenuList : MenuList;
    const cancel = isVariant ? CancelButton : null;
    const appliedStyles = isVariant ? customChipAsyncSelectStyles : customAsyncSelectStyles;
    const closeFunc = isVariant ? onClose : () => {};
    return (
      <AsyncSelect<T>
        autoFocus={autoFocus}
        backspaceRemovesValue={false}
        blurInputOnSelect={false}
        captureMenuScroll={false}
        className={className} // className is propagated from the Input component so that styles are inherited.
        closeMenuOnSelect={false}
        components={{
          Option: this.DropdownOption,
          DropdownIndicator: dropdown,
          MenuList: menuList,
          ClearIndicator: cancel,
        }}
        controlShouldRenderValue={false}
        defaultOptions={this.sortDefaultOptions(defaultOptions, value as T[])}
        getOptionValue={getOptionValue}
        hideSelectedOptions={false}
        isClearable={true}
        isDisabled={isDisabled}
        isMulti={true}
        loadOptions={loadOptions}
        menuIsOpen={menuIsOpen}
        onChange={this.onChange}
        onMenuClose={closeFunc}
        placeholder={placeholder}
        styles={appliedStyles}
        value={selected}
      />
    );
  }
}

/**
 * Select with text input and option to select multiple values.
 *
 * Loading options is intended to be asynchronous; only the number specified by the `dropdownLength` prop
 * show without user input.
 */
export class MultiSelect<T extends Option> extends React.PureComponent<IMultiSelectProps<T>, {}> {
  public render() {
    const { autoFocus, defaultOptions, disabled, dropdownLength, error, getOptionValue, loadOptions, onValueChange, placeholder, selectAllOption, value } = this.props;

    const loadOptionsDebounced = debounce((input: string) => loadOptions(input, () => {}), 500);

    return (
      <StyledInput
        disabled={disabled}
        fullWidth={true}
        error={error}
        // This is cast as any b/c the prop is typed more strictly than it should be. Cannot be narrowed
        inputComponent={WrappedAsyncSelect as any}
        inputProps={{
          autoFocus,
          defaultOptions,
          dropdownLength,
          getOptionValue,
          isDisabled: disabled,
          loadOptions: loadOptionsDebounced,
          onValueChange,
          placeholder,
          selectAllOption,
          value,
        }}
      />
    );
  }
}

/**
 * Multiselect styled to look like Chip component; used for filters and small dropdowns
 */
export class ChipMultiSelect<T extends Option> extends React.PureComponent<IMultiSelectProps<T>, {}> {
  public render() {
    const { defaultOptions, disabled, dropdownLength, error, getOptionValue, isVariant, loadOptions, onClose, onValueChange, placeholder, selectAllOption, value } = this.props;
    const loadOptionsDebounced = debounce((input: string) => loadOptions(input, () => {}), 500);
    return (
      <ChipStyledInput
        disabled={disabled}
        fullWidth={false}
        error={error}
        disableUnderline={true}
        // This is cast as any b/c the prop is typed more strictly than it should be. Cannot be narrowed
        inputComponent={WrappedAsyncSelect as any}
        inputProps={{
          autoFocus: false,
          defaultOptions,
          dropdownLength,
          getOptionValue,
          isDisabled: disabled,
          isVariant,
          loadOptions: loadOptionsDebounced,
          onClose,
          onValueChange,
          placeholder,
          selectAllOption,
          value,
        }}
      />
    );
  }
}
