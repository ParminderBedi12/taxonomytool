import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { createStyles, IconButton, TextField, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import InfoIcon from '@material-ui/icons/Info';
import { BiMap } from '@mightyhive/material-components';
import React from 'react';
import MassSelectHelp from './MassSelectHelp';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

interface MassSelectModalProps extends WithStyles<typeof styles> {
  /**
   * All terms associated with the selected Field
   */
  termList: BiMap<string, string>;
  /**
   * Takes user input back to the SelectTerms component to adjust state there
   */
  selectionCallback: (value: string[], field: string) => void;
  /**
   * Does the component render?
   */
  open: boolean;
  /**
   * Callback to open/close the modal
   */
  openCallback: (input: boolean) => void;
  /**
   * The field to which the terms correspond
   */
  termField: string;
}

interface MassSelectModalState {
  /**
   * Is the help bubble open?
   */
  helpOpen: boolean;
  /**
   * Information presented to the user about what the results of their operation would be if they click confirm
   * In the form of "X matches out of Y input terms out of Z total terms for field"
   * Or error feedback if the input is not compatible
   */
  resultsPreview: string;
  /**
   * Prop for the confirm button; set to false if the preview func evaluates everything as looking good
   */
  submitDisabled: boolean;
  /**
   * Contents of the text area field where user inputs data
   */
  textValue: string;
}

class MassSelectModal extends React.Component<MassSelectModalProps, MassSelectModalState> {
  public constructor(props: MassSelectModalProps) {
    super(props);
    this.state = {
      helpOpen: false,
      resultsPreview: '',
      submitDisabled: true,
      textValue: '',
    };
  }

  private handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = event.target.value;
    this.setState({ textValue });
    this.generatePreview(textValue);
  };

  private textToArr = (inputText: string): string[] => {
    // Split on newlines and commas
    const inputArr = inputText.split(/\n|,/);
    const noUndefinedOrEmpty: string[] = inputArr.filter((strVal) => {
      return strVal != undefined && strVal.trim() != '';
    });
    const usedArr: string[] = noUndefinedOrEmpty.map((str) => str.trim());
    return usedArr;
  };

  private generatePreview = (inputText: string) => {
    const { termList } = this.props;
    const reg = /\t/g;
    const tabCheck = reg.exec(inputText);
    if (tabCheck != null) {
      this.setState({ resultsPreview: "It appears that you've pasted in multiple columns. Make sure you enter only one column", submitDisabled: true });
      return;
    }
    const usedArr = this.textToArr(inputText);

    const matches = new Set(
      usedArr.filter((term) => {
        return termList.containsKey(term);
      }),
    );
    const numMatches = matches.size;
    const numInput = usedArr.length;
    const numTotal = termList.size();
    const resultsPreview = `${numMatches} matches found in ${numInput} terms provided out of ${numTotal} total terms`;
    // Do not enable submit if there are 0 matches
    const submitDisabled = numMatches === 0;
    this.setState({ resultsPreview, submitDisabled: submitDisabled });
  };

  private handleSubmit = (textValue: string, termField: string) => {
    const flatArr: string[] = this.textToArr(textValue);
    this.props.selectionCallback(flatArr, termField);
  };

  private handleClose = () => {
    this.setState({ resultsPreview: '', textValue: '', submitDisabled: true });
    this.props.openCallback(false);
  };

  private openHelpCallback = () => {
    this.setState({ helpOpen: true });
  };

  private closeHelpCallback = () => {
    this.setState({ helpOpen: false });
  };

  public render() {
    const { classes, open, termField } = this.props;
    const { helpOpen, resultsPreview, submitDisabled, textValue } = this.state;
    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        aria-labelledby="alert-dialog-title"
        disableBackdropClick={false}
        disableEscapeKeyDown={true}
        className={classes.root}
        maxWidth={'xs'}
        fullWidth={true}
      >
        <DialogTitle>
          Bulk Entry
          <IconButton color="primary" onClick={this.openHelpCallback}>
            <InfoIcon />
          </IconButton>
        </DialogTitle>
        {helpOpen && <MassSelectHelp helpOpen={helpOpen} handleClose={this.closeHelpCallback} />}
        <TextField label="Enter Terms" multiline rowsMax={25} value={textValue} autoFocus={true} onChange={this.handleChange} className={classes.root} />
        {resultsPreview.length > 0 && (
          <Typography variant="body1" className={classes.root}>
            {resultsPreview}
          </Typography>
        )}
        <DialogActions>
          <Button onClick={this.handleClose} variant="text">
            Cancel
          </Button>
          <Button onClick={() => this.handleSubmit(textValue, termField)} variant="text" disabled={submitDisabled}>
            Confirm Selections
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withStyles(styles)(MassSelectModal);
