import React from 'react';
import { Button, createStyles, Dialog, DialogActions, Paper, Theme, withStyles, WithStyles } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
  });

interface MassSelectHelpProps extends WithStyles<typeof styles> {
  helpOpen: boolean;
  /**
   * Callback for question bubble
   */
  handleClose: () => void;
}

function MassSelectHelp(props: MassSelectHelpProps) {
  const { classes, helpOpen, handleClose } = props;
  return (
    <React.Fragment>
      <Dialog open={helpOpen} onClose={handleClose}>
        <Paper className={classes.root} elevation={0}>
          <div>
            <p>Bulk select terms by listing them below, comma separated or pasted from a spreadsheet.</p>
            <p>Terms have to be spelled and capitalized as they are in the glossary.</p>
            <p>Selecting terms this way will overwrite any existing selections for this field.</p>
          </div>
        </Paper>
        <DialogActions>
          <Button onClick={handleClose} variant="text">
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export default withStyles(styles)(MassSelectHelp);
