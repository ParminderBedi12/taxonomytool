import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { createStyles, TextField, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import React, { useEffect, useState } from 'react';
import { GlossaryCategoryDto } from './db/GlossaryItemDto';
import { invalidCodeRegex } from './InputRegex';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

interface FreeFieldModalProps extends WithStyles<typeof styles> {
  /**
   * Sends back the user input to be written. Returns true on success
   */
  selectionCallback: (categoryName: string, values: Set<string>, previousCategoryName?: string) => boolean;
  /**
   * Does the component render?
   */
  open: boolean;
  /**
   * Callback to open/close the modal
   */
  openCallback: (input: boolean) => void;
  /**
   * Free field category being edited
   */
  editFreeFieldDto?: GlossaryCategoryDto;
  /**
   * If the modal should allow edits an admin can do. Allows editing the name of the category
   */
  isAdmin: boolean;
}

const FreeFieldModal = (props: FreeFieldModalProps) => {
  /**
   * Information presented to the user about what the results of their operation would be if they click confirm
   */
  const [resultsPreview, setResultsPreview] = useState('');
  /**
   * User input for category name
   */
  const [categoryName, setCategoryName] = useState('');
  /**
   * Contents of the text area field where user inputs data
   */
  const [termsTextValue, setTermsTextValue] = useState('');
  /**
   * Values in the textValue field parsed into result
   */
  const [parsedValues, setParsedValues] = useState(new Set<string>());

  /**
   * Initializes state based on free field object being edited
   */
  const initializeBasedOnEditedFreeField = () => {
    const terms = props.editFreeFieldDto !== undefined ? new Set<string>(props.editFreeFieldDto.terms.keys()) : new Set<string>();
    const initialCategoryName = props.editFreeFieldDto !== undefined ? props.editFreeFieldDto.name : '';
    setCategoryName(initialCategoryName);
    setTermsTextValue(props.editFreeFieldDto !== undefined ? Array.from(terms).join(', ') : '');
    setParsedValues(terms);
    generatePreview(initialCategoryName, terms);
  };

  useEffect(initializeBasedOnEditedFreeField, [props.editFreeFieldDto]);

  /**
   * Generates preview based on the parsed values
   * @param parsedValues
   */
  const generatePreview = (categoryName: string, parsedValues: Set<string>) => {
    let resultsPreview = '';
    if (categoryName === undefined || categoryName.trim() === '') {
      resultsPreview = 'Please enter a category name';
    } else if (parsedValues.size === 0) {
      resultsPreview = `Zero entries found - Creating empty free field`;
    } else {
      resultsPreview = `${parsedValues.size} entries found : ${Array.from(parsedValues).join(', ')}`;
    }
    setResultsPreview(resultsPreview);
  };

  const handleCategoryNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryName = event.target.value;
    generatePreview(categoryName, parsedValues);
    setCategoryName(categoryName);
  };

  const handleTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = event.target.value;
    setTermsTextValue(textValue);

    if (textValue === undefined || textValue.trim() === '') {
      const emptyParsedValues = new Set<string>();
      setParsedValues(emptyParsedValues);
      generatePreview(categoryName, emptyParsedValues);
      return;
    }

    const inputArr = textValue.split(/\n|,/).map((value) => value.replace(invalidCodeRegex, ''));
    const noUndefinedOrEmpty: string[] = inputArr.filter((strVal) => {
      return strVal != undefined && strVal.trim() != '';
    });
    const usedArr: string[] = noUndefinedOrEmpty.map((str) => str.trim());
    const parsedValues = new Set<string>();
    usedArr.forEach((val) => parsedValues.add(val));

    generatePreview(categoryName, parsedValues);
    setParsedValues(parsedValues);
  };

  const handleSubmit = () => {
    const success = props.selectionCallback(categoryName, parsedValues, props.editFreeFieldDto !== undefined ? props.editFreeFieldDto.name : undefined);
    if (success) {
      props.openCallback(false);
    }
  };

  const handleClose = () => {
    initializeBasedOnEditedFreeField();
    props.openCallback(false);
  };

  const { classes, open, isAdmin } = props;
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title" disableBackdropClick={false} className={classes.root} maxWidth={'xs'} fullWidth={true}>
      <DialogTitle>Free Field Add/Edit</DialogTitle>
      <TextField
        label="Category Name"
        disabled={!isAdmin}
        multiline
        rowsMax={1}
        value={categoryName}
        autoFocus={true}
        onChange={handleCategoryNameChange}
        className={classes.root}
      />
      <TextField label="Terms" multiline rowsMax={25} value={termsTextValue} onChange={handleTermsChange} className={classes.root} />
      {resultsPreview.length > 0 && (
        <Typography variant="body1" className={classes.root}>
          {resultsPreview}
        </Typography>
      )}
      <DialogActions>
        <Button onClick={handleClose} variant="text">
          Cancel
        </Button>
        <Button onClick={() => handleSubmit()} variant="text" disabled={categoryName === undefined || categoryName.length === 0}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(FreeFieldModal);
