import { withStyles, Tooltip, WithStyles } from '@material-ui/core';
import Chip from '@material-ui/core/Chip';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import React from 'react';
import Checkbox from './Checkbox';
import { optionPicker } from './styles';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

/** The rendered height, including padding and margin on dropdown menu item */
const menuItemHeight = 44;

/** The number of items to show in the menu before scrolling */
const maxNumDisplayedItems = 10;

/** The width of the dropdown menu */
const menuWidth = 400;

/** Millisecond delay for tooltip */
const tooltipEnterDelay = 700;

/** Millisecond delay for tooltip when scrolling or hovering through menu */
const tooltipEnterNextDelay = 500;

interface OptionItemProps {
  onClick(event: React.MouseEvent<HTMLLIElement, MouseEvent>): void;
  checked: boolean;
  text?: string;
}

export interface Option<T> {
  value: T;
  label: string;
}

interface OptionPickerProps<T> extends WithStyles<typeof optionPicker> {
  icon?: React.ReactElement<any>;
  label: string;
  /**
   * defaults to false, if true one one option can be selected at a time.
   */
  singleSelect?: boolean;
  /**
   * default selected option
   */
  defaultOption?: Option<T>;
  name: string;
  onSelect: (selectedValues: Option<T>[], optionName: string) => void;
  options: Option<T>[];
  /**
   * Control over what is selected if defined, if changed to undefined nothing is selected
   */
  values: Option<T>[] | undefined;
}

interface IOptionPickerState {
  anchor?: HTMLElement;
  popoverOpen: boolean;
  selectedItems: boolean[];
  newSelections: boolean[];
}

const OptionItem = (props: OptionItemProps) => {
  return (
    <MenuItem dense={true} button={true} onClick={props.onClick}>
      <Checkbox color="primary" checked={props.checked} disableRipple={true} tabIndex={-1} />
      <ListItemText primary={props.text} />
    </MenuItem>
  );
};

/**
 * A dropdown list of checkbox options
 */
class OptionPicker<T> extends React.Component<OptionPickerProps<T>, IOptionPickerState, {}> {
  constructor(props: OptionPickerProps<T>) {
    super(props);
    this.renderPopoverContent = this.renderPopoverContent.bind(this);

    this.state = {
      popoverOpen: false,
      selectedItems: props.options.map((value: Option<T>) => value.value === props.defaultOption?.value), // List of whether index is selected
      newSelections: props.options.map((value: Option<T>) => value.value === props.defaultOption?.value), // Replaces selectedItems when applied
    };
  }

  public componentDidMount() {
    const { values, options } = this.props;
    if (values === undefined) {
      return;
    }
    this.setState({
      selectedItems: options.map(
        (value: Option<T>) =>
          undefined !==
          values.find((searchElement: Option<T>): boolean => {
            return searchElement.value === value.value;
          }),
      ),
    });
    this.setState({
      newSelections: options.map(
        (value: Option<T>) =>
          undefined !==
          values.find((searchElement: Option<T>): boolean => {
            return searchElement.value === value.value;
          }),
      ),
    });
  }

  public componentDidUpdate(prevprops: OptionPickerProps<T>) {
    const { values, options } = this.props;
    if (values === prevprops.values) {
      return;
    }
    if (values === undefined) {
      this.setState({ selectedItems: options.map((value: Option<T>) => false) });
      this.setState({ newSelections: options.map((value: Option<T>) => false) });
      return;
    }
    this.setState({
      selectedItems: options.map(
        (value: Option<T>) =>
          undefined !==
          values.find((searchElement: Option<T>): boolean => {
            return searchElement.value === value.value;
          }),
      ),
    });
    this.setState({
      newSelections: options.map(
        (value: Option<T>) =>
          undefined !==
          values.find((searchElement: Option<T>): boolean => {
            return searchElement.value === value.value;
          }),
      ),
    });
  }

  private checkboxTogglerForIndex = (index: number) => {
    return () => {
      const { newSelections } = this.state;
      const { singleSelect } = this.props;
      if (singleSelect) {
        if (!newSelections[index]) {
          let emptySelections = this.state.selectedItems.map(() => false);
          emptySelections[index] = true;
          this.setState({ newSelections: emptySelections });
        }
      } else {
        const newValue = newSelections[index] !== true;
        newSelections[index] = newValue;
        this.setState({ newSelections });
      }
    };
  };

  private closePopover = () => {
    const newSelections = [...this.state.newSelections];
    this.setState({
      newSelections,
      popoverOpen: false,
    });
    const selectedOptions = this.props.options.filter((option, index) => newSelections[index] === true);
    this.props.onSelect(selectedOptions, this.props.name);
  };

  private clear = () => {
    if (this.props.singleSelect) {
      return;
    }
    const emptySelections = this.state.selectedItems.map(() => false);
    this.setState({
      newSelections: emptySelections,
      selectedItems: emptySelections,
    });
    this.props.onSelect([], this.props.name);
  };

  private renderRow = (props: ListChildComponentProps) => {
    const { index, style } = props; // The returned row should inherit style for proper behavior.
    const { options } = this.props;
    const option = options[index];
    return (
      <Tooltip enterDelay={tooltipEnterDelay} enterNextDelay={tooltipEnterNextDelay} title={option.label}>
        <div style={{ ...style }}>
          <OptionItem key={`${option.label}-${index}`} text={option.label} checked={this.state.newSelections[index]} onClick={this.checkboxTogglerForIndex(index)} />
        </div>
      </Tooltip>
    );
  };

  private renderPopoverContent = () => {
    const { options, singleSelect } = this.props;
    const { newSelections } = this.state;

    // Used to determine whether the list item should update without memoization.
    const itemData = singleSelect ? newSelections.findIndex((e) => e === true) : newSelections.filter((value) => value === true).length;

    return (
      <FixedSizeList
        height={menuItemHeight * Math.min(maxNumDisplayedItems, options.length)}
        itemCount={options.length}
        itemData={itemData}
        itemSize={menuItemHeight}
        width={menuWidth}
      >
        {this.renderRow}
      </FixedSizeList>
    );
  };

  public render() {
    const { anchor, popoverOpen, selectedItems } = this.state;
    const numSelectedItems = selectedItems.filter((item) => item === true).length;
    const countLabel = numSelectedItems > 0 ? ` • ${numSelectedItems}` : '';

    return (
      <React.Fragment>
        <Chip
          onClick={(event: React.MouseEvent<HTMLDivElement>) => {
            this.setState({
              anchor: event.currentTarget,
              popoverOpen: !this.state.popoverOpen,
            });
          }}
          icon={this.props.icon}
          label={`${this.props.label}${countLabel}`}
          variant="default"
          clickable={true}
          onDelete={numSelectedItems > 0 ? this.clear : undefined}
          color="primary"
        />
        <Popover
          anchorEl={anchor}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          open={popoverOpen}
          onClose={this.closePopover}
          transformOrigin={{ horizontal: 0, vertical: -8 }}
        >
          {this.renderPopoverContent()}
        </Popover>
      </React.Fragment>
    );
  }
}

type OptionPickerType = <T>(props: Omit<OptionPickerProps<T>, 'classes'>) => JSX.Element;

export default withStyles(optionPicker)(OptionPicker) as OptionPickerType;
