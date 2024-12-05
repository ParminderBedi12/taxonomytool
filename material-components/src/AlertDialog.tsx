import { DialogContent, DialogContentText, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import React from 'react';

interface IAlertDialogProps {
  errorMessage?: string;
  open: boolean;
  openStatusCallback: (input: boolean) => void;
}

export const AlertDialog = (props: IAlertDialogProps) => {
  const handleClose = () => {
    props.openStatusCallback(false);
  };
  const { errorMessage, open } = props;

  return (
    <div>
      <Dialog open={open} onClose={handleClose} aria-describedby="alert-dialog-description" disableBackdropClick={true} disableEscapeKeyDown={true}>
        <DialogContent>
          <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
            {errorMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="text">
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
