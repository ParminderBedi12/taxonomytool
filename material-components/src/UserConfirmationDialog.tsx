import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';

interface IUserConfirmationDialogProps {
  userPrompt?: string;
  open: boolean;
  openStatusCallback: (input: boolean) => void;
  operationCallback: () => void;
}

export const UserConfirmationDialog = (props: IUserConfirmationDialogProps) => {
  const handleClose = () => {
    props.openStatusCallback(false);
  };
  const { userPrompt, open, operationCallback } = props;

  return (
    <div>
      <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title" disableBackdropClick={true} disableEscapeKeyDown={true}>
        <DialogTitle id="alert-dialog-title">{userPrompt}</DialogTitle>
        <DialogActions>
          <Button onClick={handleClose} variant="text">
            Dismiss
          </Button>
          <Button onClick={operationCallback} variant="text">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
