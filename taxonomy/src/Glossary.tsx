import { Button, createStyles, Input, Paper, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import { AlertDialog, Option, SearchableSelect, UserConfirmationDialog } from '@mightyhive/material-components';
import React, { useState } from 'react';
import { ClaimDto } from './db/ClaimDto';
import { GlossaryItemDao } from './db/GlossaryItemDao';
import { GlossaryCategoryDto, GlossaryItemDto } from './db/GlossaryItemDto';
import { clientMetadata } from './db/TaxonomyUserDto';
import EditGlossaryNamePopup from './EditGlossaryNamePopup';
import GlossaryTables from './GlossaryTables';
import UploadButton, { FeedbackCallback } from './UploadButton';
import UploadHelp from './UploadHelp';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(4),
      flexGrow: 1,
    },
    section: {
      marginTop: theme.spacing(2),
      marginLeft: theme.spacing(2),
      marginBottom: theme.spacing(2),
      minWidth: 450,
    },
    sectionInner: {
      margin: theme.spacing(2),
    },
    sectionRight: {
      display: 'flex',
    },
    skinnySection: {
      marginTop: theme.spacing(2),
      marginLeft: theme.spacing(2),
      marginBottom: theme.spacing(2),
      minWidth: 330,
    },
  });

interface createItemDialogProps extends WithStyles<typeof styles> {
  onCreateItem: (name: string, onSuccess?: (id: string) => any) => void;
  name: string;
  onSaveAs?: (name: string, onSuccess?: (id: string) => void) => void;
}

/**
 * A dialogue for creating items for the glossary. Isolated so parent does not rerending on every string input
 * @param props
 * @returns
 */
const createItemDialog = (props: createItemDialogProps) => {
  const { classes, onCreateItem, onSaveAs, name } = props;
  const [newItemName, setNewItemName] = useState('');
  const usedClass = onSaveAs !== undefined ? classes.section : classes.skinnySection;
  return (
    <AnalyticsConsumer>
      {({ track }) => (
        <div className={usedClass}>
          <Paper>
            <Typography className={classes.sectionInner} variant="h5">
              {'Create ' + name}
            </Typography>
            <div className={classes.sectionRight}>
              <div className={classes.sectionInner}>
                <Input placeholder={'New ' + name + ' Name'} value={newItemName} onChange={(e) => setNewItemName(() => e.target.value)}></Input>
              </div>
              <div className={classes.sectionInner}>
                <Button
                  disabled={newItemName === ''}
                  onClick={() => {
                    setNewItemName('');
                    onCreateItem(newItemName || '', () => track(`Taxonomy Glossary: Create New ${name}`));
                  }}
                >
                  Create New
                </Button>
              </div>
              {onSaveAs !== undefined && (
                <div className={classes.sectionInner}>
                  <Button
                    disabled={newItemName === ''}
                    onClick={() => {
                      setNewItemName('');
                      onSaveAs(newItemName || '', () => track(`Taxonomy Glossary: Copy ${name}`));
                    }}
                  >
                    Save As
                  </Button>
                </div>
              )}
            </div>
          </Paper>
        </div>
      )}
    </AnalyticsConsumer>
  );
};
const CreateItemDialogStyled = withStyles(styles)(createItemDialog);

interface IGlossaryProps extends WithStyles<typeof styles> {
  /**
   * The current users clients
   */
  taxonomyUserClients: Map<string, clientMetadata>;
  /**
   * The glossary location for using different glossaries
   */
  glossaryLocation: string;
}

interface IGlossaryState {
  categories: GlossaryCategoryDto[];
  glossaries?: GlossaryItemDto[];
  glossaryOptions?: Option<GlossaryItemDto>[];
  selectedGlossary?: Option<GlossaryItemDto>;
  alertMessage: string;
  alertOpen: boolean;
  uploadHelpOpen: boolean;
  selectedClientOption?: Option<string>; // A selected client by user or default
  glossaryNameEditorOpen: boolean; // Controls whether the modal for editing glossary name is open or closed
  glossaryDeleteConfirmationOpen: boolean; // Controls whether the modal for glossary delete confirmation is open or closed
}

class Glossary extends React.PureComponent<IGlossaryProps, IGlossaryState> {
  private glossaryDao: GlossaryItemDao = new GlossaryItemDao();

  constructor(props: IGlossaryProps) {
    super(props);
    this.glossaryDao.setLocation(props.glossaryLocation);
    this.state = {
      categories: [],
      glossaries: undefined,
      selectedGlossary: undefined,
      alertMessage: '',
      alertOpen: false,
      uploadHelpOpen: false,
      glossaryNameEditorOpen: false,
      glossaryDeleteConfirmationOpen: false,
    };
  }

  public componentDidMount() {
    const { taxonomyUserClients } = this.props;
    this.clientDefaultUpdate(taxonomyUserClients);
  }

  public componentDidUpdate(prevProps: IGlossaryProps) {
    const { taxonomyUserClients } = this.props;
    if (prevProps.taxonomyUserClients != taxonomyUserClients) {
      this.clientDefaultUpdate(taxonomyUserClients);
    }
  }

  /**
   * Sets the default client based on the a given list of clients for both update and mount
   * @param taxonomyUserClients
   */
  private clientDefaultUpdate = (taxonomyUserClients: Map<string, clientMetadata>) => {
    if (taxonomyUserClients.size > 0) {
      const defaultKey = Array.from(taxonomyUserClients.keys())
        .filter((key) => !(taxonomyUserClients.get(key)?.isAdmin === false))
        .sort((a, b) => taxonomyUserClients.get(a)?.name.localeCompare(taxonomyUserClients.get(b)?.name || '') || 0)[0];
      if (defaultKey === undefined){
        return;
      }
      if (this.state.selectedClientOption === undefined) {
        this.setState({ selectedClientOption: { label: taxonomyUserClients.get(defaultKey)?.name || '', value: defaultKey } });
      }
      this.watchGlossaries(defaultKey);
    }
  };

  private onSelectClient = (selectedClient: Option<string>) => {
    this.setState({
      selectedClientOption: selectedClient,
      selectedGlossary: undefined,
      categories: [],
    });
    this.watchGlossaries(selectedClient.value);
  };

  /**
   * Watch glossaries under client for changes
   * @param clientId
   */
  private watchGlossaries = (clientId: string) => {
    this.glossaryDao.watchForGlossaryChanges(clientId, this.glossaryUpdate);
  };

  /**
   * Callback for when the glossaries are updated
   * @param glossaries
   */
  private glossaryUpdate = (glossaries: GlossaryItemDto[]): void => {
    let { selectedGlossary } = this.state;

    const glossaryOptions = this.buildGlossaryOptions(glossaries);

    // Default to a glossary if none is selected
    if (selectedGlossary === undefined && glossaryOptions.length > 0) {
      this.glossarySelected(glossaryOptions[0]);
    }
    this.setState({
      glossaries,
      glossaryOptions,
    });
  };

  /**
   * Contains logic for when a glossary is selected
   * @param glossary
   */
  private glossarySelected = (selectedGlossary: Option<GlossaryItemDto>): void => {
    if (selectedGlossary === undefined) {
      return;
    }
    this.glossaryDao.watchForCategoryChanges(selectedGlossary.value, this.categoriesUpdated);
    this.setState({
      selectedGlossary,
    });
  };

  /**
   * Callback for when categories are updated
   * @param categories
   */
  private categoriesUpdated = (categories: GlossaryCategoryDto[]): void => {
    this.setState({
      categories,
    });
  };

  /**
   * Builds the options for the selector
   * @param glossaryItemDtos
   * @returns
   */
  private buildGlossaryOptions = (glossaryItemDtos: GlossaryItemDto[] | undefined): Option<GlossaryItemDto>[] => {
    if (glossaryItemDtos === undefined) {
      return [];
    }

    const glossaryOptions: Option<GlossaryItemDto>[] = [];
    for (let k = 0; k < glossaryItemDtos.length; k++) {
      const glossaryItem = glossaryItemDtos[k];
      const glossarySelectionOption: Option<GlossaryItemDto> = {
        label: glossaryItem.name,
        value: glossaryItem,
      };
      glossaryOptions.push(glossarySelectionOption);
    }
    return glossaryOptions;
  };

  /**
   * Creates glossary.
   *
   * @param newGlossaryName New glossary name.
   * @param onSuccess Function called on successful create.
   * @returns
   */
  private createGlossary = (newGlossaryName: string, onSuccess?: (value: string) => any) => {
    const { selectedClientOption } = this.state;
    if (newGlossaryName === undefined || !newGlossaryName.trim() || selectedClientOption === undefined) {
      return;
    }
    const newGlossary = new GlossaryItemDto();
    newGlossary.name = newGlossaryName.trim();
    newGlossary.claim = new ClaimDto(null, selectedClientOption.value);
    const savedGlossary = this.glossaryDao.createGlossary(newGlossary);
    savedGlossary.then((id) => {
      newGlossary.id = id;
      const menuGlossary: Option<GlossaryItemDto> = { label: newGlossary.name, value: newGlossary };
      this.glossarySelected(menuGlossary);
      if (onSuccess) {
        onSuccess(id);
      }
    });
  };

  private saveGlossaryAs = (newGlossaryName: string, onSuccess?: (id: string) => any) => {
    const { categories, selectedGlossary } = this.state;
    if (newGlossaryName === undefined || !newGlossaryName.trim() || selectedGlossary === undefined || categories === undefined) {
      return;
    }
    const newGlossary = new GlossaryItemDto();
    newGlossary.name = newGlossaryName.trim();
    newGlossary.claim = selectedGlossary.value.claim;
    const savedGlossary = this.glossaryDao.createGlossary(newGlossary);
    savedGlossary
      .then((id) => {
        newGlossary.id = id;
        const menuGlossary: Option<GlossaryItemDto> = { label: newGlossary.name, value: newGlossary };
        // Once glossary is created, create all categories as well
        categories.forEach((category) => {
          const newCategory = category.deepCopy();
          this.glossaryDao.createCategory(newGlossary, newCategory).catch((e) => {
            this.setState({
              alertOpen: true,
              alertMessage: 'There was an error saving a glossary Field. Please try agin, and notify the Engineering team if the problem continues',
            });
          });
        });
        this.glossarySelected(menuGlossary);
        if (onSuccess) {
          onSuccess(id);
        }
      })
      .catch((e) => {
        this.setState({ alertOpen: true, alertMessage: 'There was an error saving your glossary. Please try agin, and notify the Engineering team if the problem continues' });
      });
  };

  /**
   * Creates category
   *
   * @param newCategoryName New category name.
   * @param onSuccess Function called on successful create.
   * @returns
   */
  private createCategory = (newCategoryName: string, onSuccess?: (value: string) => any) => {
    const { selectedGlossary } = this.state;
    if (selectedGlossary === undefined || newCategoryName === undefined || !newCategoryName.trim()) {
      return;
    }
    this.glossaryDao.getCategories(selectedGlossary.value).then((glossaryCategories) => {
      const categoryNames = glossaryCategories.map((glossaryDto) => {
        return glossaryDto.name;
      });
      if (categoryNames.includes(newCategoryName)) {
        this.setState({
          alertOpen: true,
          alertMessage: `Error creating new Field. Glossary "${selectedGlossary.label}" already includes a Field called "${newCategoryName}". Please ensure Field names are unique`,
        });
      } else {
        const newCategory = new GlossaryCategoryDto();
        newCategory.name = newCategoryName.trim();
        this.glossaryDao.createCategory(selectedGlossary.value, newCategory).then((id) => {
          if (onSuccess) {
            onSuccess(id);
          }
        });
      }
    });
  };

  /**
   * Deletes glossary
   * @param glossary
   */
  private deleteGlossary = (glossary: GlossaryItemDto) => {
    this.glossaryDao.deleteGlossary(glossary);
    this.setState({
      selectedGlossary: undefined,
      categories: [],
    });
  };

  /**
   * Deletes category
   * @param glossary
   * @param category
   */
  private deleteCategory = (category: GlossaryCategoryDto, onSuccess: () => any) => {
    const { selectedGlossary } = this.state;
    if (selectedGlossary === undefined) {
      return;
    }
    this.glossaryDao.deleteCategory(selectedGlossary.value, category);
    onSuccess();
  };

  /**
   * Used with the table on update function to update category data
   * @param category
   * @returns
   */
  private updateCategory = (category: GlossaryCategoryDto) => {
    const { selectedGlossary } = this.state;
    if (selectedGlossary === undefined) {
      return;
    }
    this.glossaryDao.updateCategory(selectedGlossary.value, category);
  };

  /**
   * Method for searchableselect to filter the glossaries
   * @param inputValue
   * @returns
   */
  private filterGlossaries = (inputValue: string): Option<GlossaryItemDto>[] => {
    const { glossaryOptions } = this.state;
    if (glossaryOptions === undefined) {
      return [];
    }
    const filteredOptions = glossaryOptions.slice();
    return filteredOptions.filter((i) => i.label.toLowerCase().includes(inputValue.toLowerCase()));
  };

  private wrapUploadCallback = (onSuccess: FeedbackCallback) => {
    return (message: string, error?: boolean) => {
      this.setState({ alertOpen: true, alertMessage: message }, () => onSuccess(message, error));
    };
  };

  private alertDialogCallback = (open: boolean) => {
    this.setState({ alertOpen: open });
  };

  private helpCallback = () => {
    this.setState({ uploadHelpOpen: false });
  };

  /**
   * Save glossary to db with updated name
   * @param updatedGlossary
   * @returns
   */
  private saveGlossaryNameUpdate = (updatedGlossary: GlossaryItemDto): boolean => {
    this.glossaryDao.updateGlossary(updatedGlossary);
    this.setState({
      selectedGlossary: {
        label: updatedGlossary.name,
        value: updatedGlossary,
      },
    });
    return true;
  };

  /**
   * Callback to open/close the free field editor
   * @param open
   */
  private handleGlossaryEditModal = (open: boolean) => {
    this.setState({ glossaryNameEditorOpen: open });
  };

  /**
   * Callback for opening/closing the glossary delete confirmation modal
   * @param open
   */
  private handleDeleteConfirmationOpenClose = (open: boolean) => {
    this.setState({ glossaryDeleteConfirmationOpen: open });
  };

  /**
   * Render client select if there are more than 1 clients available
   * @returns
   */
  private renderClientSelect = () => {
    const { selectedClientOption } = this.state;
    const { classes, taxonomyUserClients } = this.props;
    if (taxonomyUserClients.size < 2) {
      return null;
    }

    const clientOptions: Option<string>[] = Array.from(taxonomyUserClients.keys())
      .filter((key) => {
        const client = taxonomyUserClients.get(key);
        return !(client?.isAdmin === false);
      })
      .map((key) => {
        return { label: taxonomyUserClients.get(key)?.name || '', value: key };
      });

    return (
      <div className={classes.section}>
        <Paper>
          <Typography className={classes.section} variant="h5">
            Select Client
          </Typography>
          <SearchableSelect<Option<string>>
            placeholder={selectedClientOption?.label || 'Select a client'}
            loadOptions={(inputValue: string): Promise<Option<string>[]> => {
              return new Promise((resolve) => {
                resolve(clientOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
              });
            }}
            defaultOptions={clientOptions.sort((a, b) => a.label.localeCompare(b.label))}
            autoFocus={false}
            onValueChange={(value) => {
              this.onSelectClient(value);
            }}
          />
        </Paper>
      </div>
    );
  };

  public render() {
    const { classes } = this.props;
    const {
      categories,
      selectedGlossary,
      glossaries,
      glossaryOptions,
      alertOpen,
      alertMessage,
      uploadHelpOpen,
      selectedClientOption,
      glossaryNameEditorOpen,
      glossaryDeleteConfirmationOpen,
    } = this.state;
    let clientId: string;
    if (selectedClientOption != undefined) {
      clientId = selectedClientOption.value;
    } else {
      clientId = '';
    }

    return (
      <AnalyticsConsumer>
        {({ track }) => (
          <div>
            <AlertDialog open={alertOpen} errorMessage={alertMessage} openStatusCallback={this.alertDialogCallback} />
            <EditGlossaryNamePopup
              glossaryOptions={glossaries !== undefined ? glossaries : []}
              glossaryToEdit={selectedGlossary !== undefined ? selectedGlossary.value : undefined}
              open={glossaryNameEditorOpen}
              saveCallback={this.saveGlossaryNameUpdate}
              openCallback={this.handleGlossaryEditModal}
            />
            {/* Delete Glossary Confirmation Dialog */}
            <UserConfirmationDialog
              open={glossaryDeleteConfirmationOpen}
              userPrompt={selectedGlossary !== undefined ? `Do you want to delete '${selectedGlossary.value.name}?` : 'Attempting to delete undefined glossary'}
              openStatusCallback={this.handleDeleteConfirmationOpenClose}
              operationCallback={() => {
                this.deleteGlossary(selectedGlossary!.value);
                this.setState({ glossaryDeleteConfirmationOpen: false });
                track('Taxonomy Glossary: Delete Glossary');
              }}
            />
            <div style={{ display: 'flex' }}>
              {this.renderClientSelect()}
              <div className={classes.section}>
                <Paper>
                  <Typography className={classes.sectionInner} variant="h5">
                    Glossary Selection
                  </Typography>
                  <div className={classes.sectionInner}>
                    <SearchableSelect<Option<GlossaryItemDto>>
                      placeholder={selectedGlossary === undefined ? 'Please select a glossary' : selectedGlossary.label}
                      disabled={false}
                      defaultOptions={glossaryOptions === undefined ? [] : glossaryOptions}
                      loadOptions={(inputValue: string) => {
                        return new Promise<Option<GlossaryItemDto>[]>((resolve) => {
                          resolve(this.filterGlossaries(inputValue));
                        });
                      }}
                      onValueChange={(newlySelectedGlossary: Option<GlossaryItemDto>) => {
                        track('Taxonomy Glossary: Select a glossary');
                        this.glossarySelected(newlySelectedGlossary);
                      }}
                    />
                    <Button
                      onClick={() => {
                        this.handleGlossaryEditModal(true);
                      }}
                      disabled={selectedGlossary === undefined}
                    >
                      Edit Name
                    </Button>
                    <Button
                      className={classes.sectionInner}
                      onClick={() => {
                        this.setState({ glossaryDeleteConfirmationOpen: true });
                      }}
                      disabled={!selectedGlossary}
                    >
                      Delete Glossary
                    </Button>
                    <UploadButton
                      glossaryDao={this.glossaryDao}
                      feedbackCallback={this.wrapUploadCallback((_, error) => (error ? () => {} : track('Taxonomy Glossary: Upload CSV')))}
                      openHelpCallback={() => this.setState({ uploadHelpOpen: true }, () => track('Taxonomy Glossary: Select tool tip'))}
                      clientId={clientId}
                      selectionCallback={this.glossarySelected}
                    />

                    {uploadHelpOpen && <UploadHelp helpOpen={uploadHelpOpen} handleClose={this.helpCallback} />}
                  </div>
                </Paper>
              </div>
              <CreateItemDialogStyled onCreateItem={this.createGlossary} name={'Glossary'} onSaveAs={this.saveGlossaryAs} />
              <CreateItemDialogStyled onCreateItem={this.createCategory} name={'Field'} />
            </div>
            <div className={classes.section}>
              <GlossaryTables
                glossaryCategoryDtos={categories.slice().sort((a, b) => a.name.localeCompare(b.name))}
                onUpdateCategory={this.updateCategory}
                onDeleteCategory={(glossary) => this.deleteCategory(glossary, () => track('Taxonomy Glossary: Delete Glossary'))}
              />
            </div>
          </div>
        )}
      </AnalyticsConsumer>
    );
  }
}

export default withStyles(styles)(Glossary);
