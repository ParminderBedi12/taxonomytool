import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { createStyles, TextField, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import React, { useEffect, useState } from 'react';
import { GlossaryItemDto } from './db/GlossaryItemDto';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

/**
 * Modal for editing glossary name
 */
interface EditGlossaryNameModalProps extends WithStyles<typeof styles> {
  /**
   * Sends back the user input to be written. Returns true on success
   */
  saveCallback: (selectedGlossary: GlossaryItemDto) => boolean;
  /**
   * Does the component render?
   */
  open: boolean;
  /**
   * Callback to open/close the modal
   */
  openCallback: (input: boolean) => void;
  /**
   * Current glossaries
   */
  glossaryOptions: GlossaryItemDto[];
  /**
   * Glossary to edit
   */
  glossaryToEdit?: GlossaryItemDto;
}

const EditGlossaryNameModal = (props: EditGlossaryNameModalProps) => {
  /**
   * User input for category name
   */
  const [glossaryName, setGlossaryName] = useState('');

  /**
   * Initializes state for clean load
   */
  const init = () => {
    const glossaryName = props.glossaryToEdit !== undefined ? props.glossaryToEdit.name : '';
    setGlossaryName(glossaryName);
    generatePreview(glossaryName, props.glossaryOptions, props.glossaryToEdit);
  };

  useEffect(init, [props.glossaryToEdit, props.glossaryOptions]);

  /**
   * Generates preview based on the parsed values
   * @param parsedValues
   */
  const generatePreview = (glossaryName: string, glossaryOptions: GlossaryItemDto[], glossaryToEdit?: GlossaryItemDto): string => {
    let resultsPreview = '';

    const glossaryNames = glossaryOptions !== undefined ? glossaryOptions?.map((a) => a.name) : [];
    if (glossaryToEdit === undefined) {
      resultsPreview = 'Error with glossary name edit - please report the issue';
    } else if (glossaryName === undefined || glossaryName.trim() === '' || glossaryName === glossaryToEdit.name) {
      resultsPreview = `Please enter a new name to rename '${glossaryToEdit.name}'`;
    } else if (glossaryNames.includes(glossaryName)) {
      resultsPreview = `Glossary name '${glossaryToEdit.name}' is already taken. Please use a new name`;
    } else {
      resultsPreview = `Renaming glossary '${glossaryToEdit.name}' to '${glossaryName}'`;
    }
    return resultsPreview;
  };

  const handleGlossaryNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const glossaryName = event.target.value.trim();
    generatePreview(glossaryName, props.glossaryOptions, props.glossaryToEdit);
    setGlossaryName(glossaryName);
  };

  const handleSave = () => {
    if (props.glossaryToEdit === undefined) {
      console.error('glossary name edit called from invalid state');
      return;
    }
    let updatedGlossary = new GlossaryItemDto();
    updatedGlossary.id = props.glossaryToEdit.id;
    updatedGlossary.creationTime = props.glossaryToEdit.creationTime;
    updatedGlossary.claim = props.glossaryToEdit.claim;
    updatedGlossary.name = glossaryName;
    const success = props.saveCallback(updatedGlossary);
    if (success) {
      props.openCallback(false);
    }
  };

  const handleClose = () => {
    props.openCallback(false);
  };

  const { classes, open } = props;
  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title" disableBackdropClick={false} className={classes.root} maxWidth={'xs'} fullWidth={true}>
      <DialogTitle>Edit Glossary Name</DialogTitle>
      <TextField label="Glossary Name" multiline rowsMax={1} value={glossaryName} autoFocus={true} onChange={handleGlossaryNameChange} className={classes.root} />
      <Typography variant="body1" className={classes.root}>
        {generatePreview(glossaryName, props.glossaryOptions, props.glossaryToEdit)}
      </Typography>
      <DialogActions>
        <Button onClick={handleClose} variant="text">
          Cancel
        </Button>
        <Button onClick={() => handleSave()} variant="text" disabled={glossaryName === undefined || glossaryName.length === 0}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(EditGlossaryNameModal);
