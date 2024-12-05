import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { createStyles, TextField, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import React, { useEffect, useState } from 'react';
import TaxonomyGroupClaimsDto from './db/TaxonomyGroupClaimsDto';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

interface ClientOptions {
  label: string;
  id: string;
}

/**
 * Modal for editing client name
 */
interface EditClientNameModalProps extends WithStyles<typeof styles> {
  /**
   * Sends back the user input to be written. Returns true on success
   */
  saveCallback: (selectedClient: TaxonomyGroupClaimsDto) => boolean;
  /**
   * Does the component render?
   */
  open: boolean;
  /**
   * Callback to open/close the modal
   */
  openCallback: (input: boolean) => void;
  /**
   * Current clients
   */
  clientOptions: ClientOptions[];
  /**
   * Client to edit
   */
  clientToEdit?: TaxonomyGroupClaimsDto;
}

const EditClientNameModal = (props: EditClientNameModalProps) => {
  /**
   * User input for category name
   */
  const [clientName, setClientName] = useState('');

  /**
   * Initializes state for clean load
   */
  const init = () => {
    const clientName = props.clientToEdit !== undefined ? props.clientToEdit.clientName : '';
    setClientName(clientName);
    generatePreview(clientName, props.clientOptions, props.clientToEdit);
  };

  useEffect(init, [props.clientToEdit, props.clientOptions]);

  /**
   * Generates preview based on the parsed values
   * @param parsedValues
   */
  const generatePreview = (clientName: string, clientOptions: ClientOptions[], clientToEdit?: TaxonomyGroupClaimsDto): string => {
    let resultsPreview = '';

    const clientNames = clientOptions !== undefined ? clientOptions?.map((a) => a.label) : [];
    if (clientToEdit === undefined) {
      resultsPreview = 'Error with client name edit - please report the issue';
    } else if (clientName === undefined || clientName.trim() === '' || clientName === clientToEdit.clientName) {
      resultsPreview = `Please enter a new name to rename '${clientToEdit.clientName}'`;
    } else if (clientNames.includes(clientName)) {
      resultsPreview = `Client name '${clientToEdit.clientName}' is already taken. Please use a new name`;
    } else {
      resultsPreview = `Renaming client '${clientToEdit.clientName}' to '${clientName}'`;
    }
    return resultsPreview;
  };

  const handleClientNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const clientName = event.target.value;
    generatePreview(clientName, props.clientOptions, props.clientToEdit);
    setClientName(clientName);
  };

  const handleSave = () => {
    if (props.clientToEdit === undefined) {
      console.error('client name edit called from invalid state');
      return;
    }
    const updatedClient = new TaxonomyGroupClaimsDto(clientName, props.clientToEdit.users, props.clientToEdit.admins);
    updatedClient.id = props.clientToEdit.id;
    updatedClient.creationTime = props.clientToEdit.creationTime;
    const success = props.saveCallback(updatedClient);
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
      <DialogTitle>Edit Client Name</DialogTitle>
      <TextField label="Client Name" multiline rowsMax={1} value={clientName} autoFocus={true} onChange={handleClientNameChange} className={classes.root} />
      <Typography variant="body1" className={classes.root}>
        {generatePreview(clientName, props.clientOptions, props.clientToEdit)}
      </Typography>
      <DialogActions>
        <Button onClick={handleClose} variant="text">
          Cancel
        </Button>
        <Button onClick={() => handleSave()} variant="text" disabled={clientName === undefined || clientName.length === 0}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(EditClientNameModal);
