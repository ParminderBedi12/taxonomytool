import { Button, createStyles, Dialog, DialogActions, DialogTitle, Input, Paper, Theme, Typography, useTheme, withStyles, WithStyles } from '@material-ui/core';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import React, { useState } from 'react';
import { Option, SearchableSelect } from '../../material-components/lib';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(2),
    },
    inner: {
      margin: theme.spacing(2),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    selection: {
    },
  });

interface SelectTemplateAttributesProps extends WithStyles<typeof styles> {
  selectedCampaignTypeValue?: Option<string>;
  selectedBusinessValue?: Option<string>;
  selectedDelimiterValue?: Option<string>;
  selectedGlossaryValue?: Option<string>;
  selectedGlossaryJumpID?: Option<string>;

  teamOptions: Option<string>[];
  channelOptions: Option<string>[];
  delimiterOptions: Option<string>[];
  glossaryOptions: Option<string>[];
  glossaryJumpIDOptions: Option<string>[];
  /**
   * User selected strings
   */
  onChange: (team?: Option<string>, channel?: Option<string>, delimiter?: Option<string>, glossary?: Option<string>, glossaryJumpID?: Option<string>) => void;
  isAdmin: boolean;
}

interface SelectTemplateAttributesState {
  isTeamOpen: boolean;
  isChannelOpen: boolean;
  isDelimiterOpen: boolean;
}

interface OptionPopupProps {
  open: boolean;
  selectedValue?: string;
  title: string;
  onClose: (value?: string) => void;
}

const OptionPopup = (props: OptionPopupProps) => {
  const { title, open, onClose, selectedValue } = props;
  const theme = useTheme();

  const [inputString, setInputString] = useState('');
  const handleClose = () => {
    onClose(selectedValue);
  };

  return (
    <AnalyticsConsumer>
      {({ instrument }) => (
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-input-title"
          onKeyUp={instrument(
            (KeyboardEvent: React.KeyboardEvent) => {
              if (KeyboardEvent.key === 'Enter') {
                onClose(inputString);
              }
            },
            `Taxonomy: ${title}`,
            { input: inputString },
          )}
        >
          <DialogTitle id="alert-input-title">{title}</DialogTitle>
          <Input style={{ margin: theme.spacing(2) }} placeholder={title} onChange={(event) => setInputString(event.target.value)} value={inputString} autoFocus={true} />
          <DialogActions>
            <Button onClick={() => onClose(selectedValue)} variant="text">
              Close
            </Button>
            <Button
              onClick={instrument(
                () => {
                  onClose(inputString);
                },
                `Taxonomy: ${title}`,
                { input: inputString },
              )}
              variant="text"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AnalyticsConsumer>
  );
};

class SelectTemplateAttributes extends React.PureComponent<SelectTemplateAttributesProps, SelectTemplateAttributesState> {
  public constructor(props: SelectTemplateAttributesProps) {
    super(props);
    this.state = {
      isTeamOpen: false,
      isChannelOpen: false,
      isDelimiterOpen: false,
    };
  }

  private onChange = (campaignType: Option<string> | undefined, Business: Option<string> | undefined, delimiter: Option<string> | undefined, glossary: Option<string> | undefined, glossaryJumpID: Option<string> | undefined) => {
    const { selectedCampaignTypeValue, selectedBusinessValue, selectedDelimiterValue, selectedGlossaryValue, selectedGlossaryJumpID } = this.props;
    this.props.onChange(campaignType || selectedCampaignTypeValue, Business || selectedBusinessValue, delimiter || selectedDelimiterValue, glossary || selectedGlossaryValue, glossaryJumpID || selectedGlossaryJumpID);
  };

  public render() {
    const { isTeamOpen, isDelimiterOpen, isChannelOpen } = this.state;
    const {
      teamOptions,
      channelOptions,
      delimiterOptions,
      glossaryOptions,
      glossaryJumpIDOptions,
      selectedCampaignTypeValue,
      selectedBusinessValue,
      selectedDelimiterValue,
      selectedGlossaryValue,
      selectedGlossaryJumpID,
      classes,
      isAdmin,
    } = this.props;
    const disabled = isAdmin == false;

    return (
      <AnalyticsConsumer>
        {({ track }) => (
          <Paper className={classes.root}>
            <div className={classes.inner}>
              <Typography className={classes.selection} variant="h4">
                Template Attributes
              </Typography>
              <div className={classes.selection}>
                <SearchableSelect<Option<string>>
                  placeholder={selectedCampaignTypeValue?.label || 'Select a Campaign Type'}
                  loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                    return new Promise((resolve) => {
                      resolve(teamOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                    });
                  }}
                  defaultOptions={teamOptions}
                  autoFocus={false}
                  onValueChange={(value) => {
                    track('Taxonomy: Select A Campaign Type');
                    this.onChange(value, undefined, undefined, undefined, undefined);
                  }}
                  disabled={disabled}
                  error={selectedCampaignTypeValue === undefined}
                />
                {isAdmin === true && <Button onClick={() => this.setState({ isTeamOpen: true })}>Set a New Campaign Type Option</Button>}
                <OptionPopup
                  open={isTeamOpen}
                  title={'Set a new Campaign Type Option'}
                  onClose={(option) =>
                    this.setState({ isTeamOpen: false }, () =>
                      this.onChange(option ? { value: option.trim(), label: option.trim() } : undefined, undefined, undefined, undefined, undefined),
                    )
                  }
                  selectedValue={selectedCampaignTypeValue?.value}
                />
              </div>
              <div className={classes.selection}>
                <SearchableSelect<Option<string>>
                  placeholder={selectedBusinessValue?.label || 'Select a Business'}
                  loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                    return new Promise((resolve) => {
                      resolve(channelOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                    });
                  }}
                  defaultOptions={channelOptions}
                  autoFocus={false}
                  onValueChange={(value) => {
                    track('Taxonomy: Select A Business');
                    this.onChange(undefined, value, undefined, undefined, undefined);
                  }}
                  disabled={disabled}
                  error={selectedBusinessValue === undefined}
                />
                {isAdmin === true && <Button onClick={() => this.setState({ isChannelOpen: true })}>Set a New Business Option</Button>}
                <OptionPopup
                  open={isChannelOpen}
                  title={'Set a New Business Option'}
                  onClose={(option) =>
                    this.setState({ isChannelOpen: false }, () =>
                      this.onChange(undefined, option ? { value: option.trim(), label: option.trim() } : undefined, undefined, undefined, undefined),
                    )
                  }
                  selectedValue={selectedBusinessValue?.value || ''}
                />
              </div>
              <div className={classes.selection}>
                <SearchableSelect<Option<string>>
                  placeholder={selectedDelimiterValue?.label || 'Select a delimiter'}
                  loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                    return new Promise((resolve) => {
                      resolve(delimiterOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                    });
                  }}
                  defaultOptions={delimiterOptions}
                  autoFocus={false}
                  onValueChange={(value) => {
                    track('Taxonomy: Select A Delimiter');
                    this.onChange(undefined, undefined, value, undefined, undefined);
                  }}
                  disabled={disabled}
                  error={selectedDelimiterValue === undefined}
                />
                {isAdmin === true && <Button onClick={() => this.setState({ isDelimiterOpen: true })}>Set a New Delimiter Option</Button>}
                <OptionPopup
                  open={isDelimiterOpen}
                  title={'Set a New Delimiter Option'}
                  onClose={(option) =>
                    this.setState({ isDelimiterOpen: false }, () =>
                      this.onChange(undefined, undefined, option ? { value: option.trim(), label: option.trim() } : undefined, undefined, undefined),
                    )
                  }
                  selectedValue={selectedDelimiterValue?.value || ''}
                />
              </div>
              <div className={classes.selection}>
                <SearchableSelect<Option<string>>
                  placeholder={selectedGlossaryValue?.label || 'Select a glossary'}
                  loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                    return new Promise((resolve) => {
                      resolve(glossaryOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                    });
                  }}
                  defaultOptions={glossaryOptions}
                  autoFocus={false}
                  onValueChange={(value) => {
                    track('Taxonomy: Select A Glossary');
                    this.onChange(undefined, undefined, undefined, value, undefined);
                  }}
                  disabled={disabled}
                  error={selectedGlossaryValue === undefined}
                />
              </div>
              <div className={classes.selection}>
                <SearchableSelect<Option<string>>
                  placeholder={selectedGlossaryJumpID?.label || 'Select a Jump ID glossary'}
                  loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                    return new Promise((resolve) => {
                      resolve(glossaryJumpIDOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                    });
                  }}
                  defaultOptions={glossaryJumpIDOptions}
                  autoFocus={false}
                  onValueChange={(value) => {
                    track('Taxonomy: Select A Jump ID Glossary');
                    this.onChange(undefined, undefined, undefined, undefined, value);
                  }}
                  disabled={disabled}
                  error={selectedGlossaryJumpID === undefined}
                />
              </div>
            </div>
          </Paper>
        )}
      </AnalyticsConsumer>
    );
  }
}

export default withStyles(styles)(SelectTemplateAttributes);
