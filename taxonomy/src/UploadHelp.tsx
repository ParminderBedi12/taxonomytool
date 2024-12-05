import React from 'react';
import { createStyles, Button, Dialog, DialogActions, Grid, Paper, TextField, Theme, withStyles, WithStyles } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
    straightBorders: {
      borderRadius: 0,
    },
  });

interface UploadHelpProps extends WithStyles<typeof styles> {
  helpOpen: boolean;
  /**
   * Callback for question bubble
   */
  handleClose: () => void;
}

function UploadHelp(props: UploadHelpProps) {
  const { classes, helpOpen, handleClose } = props;
  return (
    <React.Fragment>
      <Dialog open={helpOpen} onClose={handleClose}>
        <Paper className={classes.root} elevation={0}>
          <div>
            <p>The upload expects a CSV file with pairs of columns representing a single field, with the Name (display name) column followed by the Code (value used in string)</p>
            <p>Column headers must end in "_Name" or "_Code" as appropriate. This is not case sensitive.</p>
            <p>For a field called "Quarter", there would be the following setup:</p>
            <Grid container spacing={0}>
              <Grid container item xs={12} spacing={0}>
                <Grid item xs={6}>
                  <TextField disabled value="Quarter_Name" variant="outlined" fullWidth={true} InputProps={{ className: classes.straightBorders }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField disabled value="Quarter_Code" variant="outlined" fullWidth={true} InputProps={{ className: classes.straightBorders }} />
                </Grid>
              </Grid>
              <Grid container item xs={12} spacing={0}>
                <Grid item xs={6}>
                  <TextField disabled value="Quarter 3" variant="outlined" fullWidth={true} InputProps={{ className: classes.straightBorders }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField disabled value="Q3" variant="outlined" fullWidth={true} InputProps={{ className: classes.straightBorders }} />
                </Grid>
              </Grid>
              <Grid container item xs={12} spacing={0}>
                <Grid item xs={6}>
                  <TextField disabled value="Quarter 4" variant="outlined" fullWidth={true} InputProps={{ className: classes.straightBorders }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField disabled value="Q4" variant="outlined" fullWidth={true} InputProps={{ className: classes.straightBorders }} />
                </Grid>
              </Grid>
            </Grid>
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

export default withStyles(styles)(UploadHelp);
