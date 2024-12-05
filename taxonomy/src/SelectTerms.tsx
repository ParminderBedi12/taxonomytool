import { Button, createStyles, FormControl, Grid, InputLabel, Paper, Select, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import { BiMap, BiMapBuilder, SearchableSelect, Option } from '@mightyhive/material-components';
import React, { Fragment } from 'react';
import { GlossaryCategoryDto } from './db/GlossaryItemDto';
import MassSelectModal from './MassSelectModal';

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
    terms: {
      display: 'flex',
      flexDirection: 'column',
    },
    term: {
      margin: theme.spacing(2),
    },
    selectButton: {
      display: 'inline-block',
      width: '150px',
      margin: theme.spacing(2),
    },
    massButton: {
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
  });

interface SelectTermsProps extends WithStyles<typeof styles> {
  /**
   * All available category options
   */
  allOptions: GlossaryCategoryDto[];
  /**
   * Initially selected fields (from Taxonomy DB Object)
   */
  initialTerms: GlossaryCategoryDto[];
  /**
   * Whenever selections change call the callback with the selected fields
   */
  onChange: (selectedTerms: GlossaryCategoryDto[]) => void;
  editCategoryCallback: (editCategory: GlossaryCategoryDto) => void;
  deleteCategoryCallback: (deleteCategory: GlossaryCategoryDto) => void;
  /**
   * If the user has access to delete or edit the name
   */
  isAdmin: boolean;
  /**
   * If only one item can be selected using drop downs
   */
  isSelect: boolean;
  /**
   * If the component is displayed. Used instead of refactoring code because this has been split from the upstream code
   */
  isEnabled: boolean;
}

interface SelectTermsState {
  massSelectOpen: boolean;
  massSelectTerms: BiMap<string, string>;
  massSelectField: string;
  selectedTerms: GlossaryCategoryDto[];
}

class SelectTerms extends React.Component<SelectTermsProps, SelectTermsState> {
  public constructor(props: SelectTermsProps) {
    super(props);
    this.state = {
      massSelectOpen: false,
      massSelectTerms: new BiMapBuilder<string, string>().empty(),
      massSelectField: '',
      selectedTerms: [],
    };
  }

  // This should be removed and refactored
  public componentDidUpdate(prevProps: SelectTermsProps) {
    if (prevProps.allOptions != this.props.allOptions) {
      const { selectedTerms } = this.state;
      if (this.props.allOptions !== undefined && this.props.allOptions.length > 0) {
        let updatedSelectedTerms: GlossaryCategoryDto[] = selectedTerms.slice();
        // If something in selected terms is gone from options, remove from selected
        const allOptionCategoryNames = this.props.allOptions.map((dto) => dto.name);
        updatedSelectedTerms = selectedTerms.filter((selectedTerm) => allOptionCategoryNames.includes(selectedTerm.name));

        // If a free field has been added, add it to selectedTerms
        const allSelectedTermNames = updatedSelectedTerms.map((dto) => dto.name);
        const newOptions = this.props.allOptions.filter((option) => !allSelectedTermNames.includes(option.name));
        const newFreeFields = newOptions.filter((dto) => dto.freeField);
        updatedSelectedTerms = updatedSelectedTerms.concat(newFreeFields);

        // If any free fields are selected, select all their fields
        updatedSelectedTerms.forEach((selectedTerm) => {
          if (selectedTerm.freeField) {
            const allTerms = this.props.allOptions.filter((option) => option.name === selectedTerm.name)[0];
            selectedTerm.terms = allTerms.terms;
          }
        });

        // If categories are in allOptions but not selected terms, add them to selected terms with no terms selected
        const currentlySelectedTermNameSet = new Set(updatedSelectedTerms.map((term) => term.name));
        const newlySelectedTerms = this.props.allOptions.filter((option) => !currentlySelectedTermNameSet.has(option.name));
        if (newlySelectedTerms.length > 0) {
          let emptyCategory = newlySelectedTerms[0].deepCopy();
          emptyCategory.terms = new BiMap<string, string>();
          updatedSelectedTerms.push(emptyCategory);
        }

        this.setState({ selectedTerms: updatedSelectedTerms }, () => {
          this.props.onChange(updatedSelectedTerms);
        });
      }
    }
    if (prevProps.initialTerms != this.props.initialTerms) {
      this.setState({ selectedTerms: this.props.initialTerms });
    }
  }

  private onChange = () => {
    this.props.onChange(this.state.selectedTerms);
  };

  private onChangeSelection = (field: string, target: HTMLSelectElement) => {
    const { selectedTerms } = this.state;
    const { options } = target;

    // DTO from all available categories - should always exist
    const originalDto: GlossaryCategoryDto = this.props.allOptions.filter((dto) => {
      return dto.name == field;
    })[0];

    // Do not allow edits for free fields
    if (originalDto.freeField) {
      return;
    }

    // Filtered DTO (may return none)
    const potentialFieldToModify: GlossaryCategoryDto[] = selectedTerms.filter((dto) => {
      return dto.name == field;
    });

    let fieldBeingUpdated;

    // First time this map is being written to
    if (potentialFieldToModify.length == 0) {
      fieldBeingUpdated = new GlossaryCategoryDto();
      fieldBeingUpdated.id = originalDto.id;
      fieldBeingUpdated.name = originalDto.name;
      fieldBeingUpdated.terms = new BiMapBuilder<string, string>().empty();
      selectedTerms.push(fieldBeingUpdated);
    } else {
      fieldBeingUpdated = potentialFieldToModify[0];
    }

    for (let i = 0; i < options.length; i += 1) {
      const name = options[i].value;
      const code = originalDto.terms.getByKey(name) as string;
      if (options[i].selected) {
        // Select
        fieldBeingUpdated.terms.forceSet(name, code);
      } else {
        // Unselect
        if (fieldBeingUpdated.terms.getByKey(name) == code) {
          fieldBeingUpdated.terms.deleteByKey(name);
        }
      }
    }

    this.onChange();
    this.setState({ selectedTerms });
  };

  private selectAll = () => {
    const { allOptions: allAvailableCategories } = this.props;

    const allAvailableCategoriesCopy: GlossaryCategoryDto[] = allAvailableCategories.map((category) => {
      return category.deepCopy();
    });

    this.setState({ selectedTerms: allAvailableCategoriesCopy }, () => this.props.onChange(allAvailableCategoriesCopy));
  };

  private deselectAll = () => {
    const { selectedTerms } = this.state;
    // Blank everything except free fields
    const updatedSelectedTerms: GlossaryCategoryDto[] = selectedTerms.slice();
    updatedSelectedTerms.forEach((selected) => {
      if (!selected.freeField) {
        selected.terms = new BiMap<string, string>();
      }
    });
    this.setState({ selectedTerms: updatedSelectedTerms }, () => this.props.onChange(updatedSelectedTerms));
  };

  private openMassSelect = (massSelectTerms: BiMap<string, string>, field: string) => {
    this.setState({ massSelectOpen: true, massSelectTerms, massSelectField: field });
  };

  private handleMassSelect = (open: boolean) => {
    this.setState({ massSelectOpen: open });
  };

  private massSelect = (inputTerms: string[], inputField: string) => {
    const { selectedTerms } = this.state;
    const originalDto: GlossaryCategoryDto = this.props.allOptions.filter((dto) => {
      return dto.name == inputField;
    })[0];
    const matchBiMap = new BiMapBuilder<string, string>().empty();
    originalDto.terms.forEach((value, key) => {
      if (inputTerms.includes(key)) {
        matchBiMap.set(key, value);
      }
    });
    // Iterate over the selectedTerms to set new Terms on our Category
    for (let i = 0; i < selectedTerms.length; i++) {
      if (selectedTerms[i].name == originalDto.name) {
        selectedTerms[i].terms = matchBiMap;
      }
    }
    this.setState({ selectedTerms, massSelectOpen: false });
    this.props.onChange(selectedTerms);
  };

  /**
   *
   * @returns Term selection forms, only display active ones
   */
  private renderTermSelections = () => {
    const { allOptions: allAvailableCategories, classes, editCategoryCallback, deleteCategoryCallback, isAdmin } = this.props;
    const { selectedTerms } = this.state;
    return (
      <div className={classes.terms}>
        {Array.from(allAvailableCategories).filter((value) => value.isActive).map((entry) => {
          const selectedCategory = selectedTerms.filter((ent) => {
            return ent.name == entry.name;
          })[0];

          const selectedNames = selectedCategory !== undefined ? Array.from(selectedCategory.terms.keys()) : [];

          return (
            <FormControl key={entry.name + '-form'} className={classes.term}>
              <Grid justify="space-between" container>
                <Grid item>
                  <InputLabel shrink>{entry.name}</InputLabel>
                </Grid>
                {entry.freeField && (
                  <React.Fragment>
                    <Grid item>
                      <Button className={classes.massButton} onClick={() => editCategoryCallback(entry)}>
                        Edit Freeform
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button disabled={!isAdmin} className={classes.massButton} onClick={() => deleteCategoryCallback(entry)}>
                        Delete Freeform
                      </Button>
                    </Grid>
                  </React.Fragment>
                )}
                {!entry.freeField && (
                  <Grid item>
                    <Button onClick={() => this.openMassSelect(entry.terms, entry.name)} className={classes.massButton}>
                      Bulk Entry
                    </Button>
                  </Grid>
                )}
              </Grid>
              <Select
                multiple
                native
                error={selectedNames.length == 0 && !isAdmin}
                disabled={entry.freeField}
                value={selectedNames}
                onChange={(e) => this.onChangeSelection(entry.name, e.target as HTMLSelectElement)}
                inputProps={{
                  id: 'select-multiple-native' + entry.name,
                  style: { minHeight: 200 }
                }}
              >
                {Array.from(entry.terms.keys())
                  .sort((a, b) => a.localeCompare(b))
                  .map((name) => {
                    const code = entry.terms.getByKey(name);

                    return (
                      <option key={code} value={name}>
                        {name}
                      </option>
                    );
                  })}
              </Select>
            </FormControl>
          );
        })}
      </div>
    );
  };

  private renderTermSelect = () => {
    const { allOptions: allAvailableCategories, classes, isAdmin } = this.props;
    const { selectedTerms } = this.state;

    return (
      <div className={classes.terms}>
        {Array.from(allAvailableCategories).filter((value) => value.isActive).map((entry) => {
          const selectedCategory = selectedTerms.filter((ent) => {
            return ent.name == entry.name;
          })[0];

          const selectedName = selectedCategory !== undefined ? Array.from(selectedCategory.terms.keys())[0] : undefined;
          const entryOptions: Option<string>[] = Array.from(entry.terms.keys().values()).
            map(term => { return { label: term, value: entry.terms.getByKey(term) || '' }; })
            .sort((a, b) => a.label.localeCompare(b.label));

          return (
            <div key={entry.name + '-form'} className={classes.term}>
              <Grid justify="space-between" container>
                <Grid item>
                  <InputLabel shrink>{entry.name}</InputLabel>
                </Grid>
              </Grid>
              <SearchableSelect<Option<string>>
                placeholder={selectedName || 'Select a value'}
                loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                  return new Promise((resolve) => {
                    resolve(entryOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                  });
                }}
                defaultOptions={entryOptions}
                autoFocus={false}
                error={selectedName === undefined && !isAdmin}
                onValueChange={(value) => {
                  this.massSelect([value.label], entry.name)
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  public render() {
    const { classes, allOptions: allAvailableCategories, isSelect, isEnabled } = this.props;
    const { massSelectOpen, massSelectTerms, massSelectField } = this.state;

    if (!isEnabled) {
      return <Fragment />
    }

    return (
      <AnalyticsConsumer>
        {({ instrument }) => (
          <Paper className={classes.root}>
            <div className={classes.inner}>
              <MassSelectModal
                open={massSelectOpen}
                termList={massSelectTerms}
                termField={massSelectField}
                openCallback={this.handleMassSelect}
                selectionCallback={this.massSelect}
              />
              <Typography variant="h4">
                Terms
              </Typography>
              {(allAvailableCategories.length > 0 && !isSelect) && (
                <Button className={classes.selectButton} onClick={instrument(() => this.selectAll(), 'Taxonomy: Select All Terms')}>
                  Select All
                </Button>
              )}
              {(allAvailableCategories.length > 0 && !isSelect) && (
                <Button className={classes.selectButton} onClick={instrument(() => this.deselectAll(), 'Taxonomy: Deselect All Terms')}>
                  Deselect All
                </Button>
              )}
              {isSelect ? this.renderTermSelect() : this.renderTermSelections()}
            </div>
          </Paper>
        )}
      </AnalyticsConsumer>
    );
  }
}

export default withStyles(styles)(SelectTerms);
