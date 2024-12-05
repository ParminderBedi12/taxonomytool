import { Box, Button, createStyles, FormControl, FormControlLabel, Paper, Radio, RadioGroup, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import React from 'react';
import { GlossaryItemDao, jumpIDGlossaryLocation } from './db/GlossaryItemDao';
import { CreationReturnObject, TaxonomyTemplateDao } from './db/TaxonomyTemplateDao';
import TaxonomyTemplateDto from './db/TaxonomyTemplateDto';
import DraggableFields, { Fields } from './DraggableFields';
import SelectTemplateAttributes from './SelectTemplateAttributes';
import SelectTerms from './SelectTerms';
import { AlertDialog, BiMap, Option, SearchableSelect, UserConfirmationDialog } from '@mightyhive/material-components';
import { GlossaryCategoryDto, GlossaryItemDto } from './db/GlossaryItemDto';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import FreeFieldModal from './FreeFieldModal';
import { clientMetadata } from './db/TaxonomyUserDto';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(4),
      flexGrow: 1,
    },
    section: {
      margin: theme.spacing(2),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    topSection: {
      marginLeft: theme.spacing(2),
      marginRight: theme.spacing(2),
    }
  });

interface TaxonomatorProps extends WithStyles<typeof styles> {
  /**
   * The current users clients
   */
  taxonomyUserClients: Map<string, clientMetadata>;
  /**
   * Function to generate the strings from template options
   */
  generateStringsCallback: (delimiter: string, selectedCategoriesAndTerms: GlossaryCategoryDto[], selectedJumpIDCategoriesAndTerms: GlossaryCategoryDto[], team: string, channel: string) => void;
  /**
   * Certain UI features are disabled for non-admins
   */
  isAdmin: boolean;
}

interface TaxonomatorState {
  /**
   * The user string
   */
  templateName: string;
  /**
   * selected template attributes
   */
  selectedCampaignTypeOption?: Option<string>;
  selectedBusinessOption?: Option<string>;
  selectedDelimiterOption?: Option<string>;
  selectedGlossaryOption?: Option<string>; // Value is glossaryId
  selectedGlossaryJumpID?: Option<string>;
  /**
   * filters for template selection
   */
  filterTeamOption?: Option<string>;
  filterChannelOption?: Option<string>;
  /**
  * Options for template attributes
  */
  teamOptions: Option<string>[];
  delimiterOptions: Option<string>[];
  channelOptions: Option<string>[];
  /**
   * List of glossaries to choose from for templates
   */
  glossaryOptions: Option<string>[];
  /**
   * List of glossaries to choose from for templates
   */
  glossaryjumpIDOptions: Option<string>[];
  /**
   * Categories selected in the "Include UI"
   */
  includedCategories: GlossaryCategoryDto[];
  /**
   * Categories selected in the "Include UI"
   */
  includedJumpIDCategories: GlossaryCategoryDto[];
  /**
   * current set of all possible categories/terms for the template (from the Glossary DB)
   */
  glossaryCategoryDtos: GlossaryCategoryDto[];
  /**
   * current set of all possible categories/terms for the template (from the Glossary DB)
   */
  glossaryJumpIDCategoryDtos: GlossaryCategoryDto[];
  /**
   * All possible category options. Includes glossary db data, used free fields, and unused free fields
   */
  allCategoryOptions: GlossaryCategoryDto[];
  /**
 * All possible category for Jumpid options. Includes glossary db data, used free fields, and unused free fields
 */
  allJumpIDCategoryOptions: GlossaryCategoryDto[];
  /**
   * List of draggable categories for filtering for included categories
   */
  draggableCategories: Fields;
  /**
   * List of draggable Jump ID categories for filtering for included categories
   */
  draggableJumpIDCategories: Fields;
  /**
   * Only the categories and terms selected by the user
   * Will be written to DB on save
   */
  userSelectedCategoriesAndTerms: GlossaryCategoryDto[];
  /**
 * Only the categories and terms selected by the user
 * Will be written to DB on save
 */
  userSelectedJumpIDCategoriesAndTerms: GlossaryCategoryDto[];
  /**
   * The terms loaded from a template or the default of nothing if creating all new
   * Brings in terms from template DB, never updated (unless DB template is saved)
   * Will not query glossary/categories, just categories from the taxonomy object
   * Includes free fields
   */
  loadedTermsFromDB: GlossaryCategoryDto[];
  /**
   * The terms loaded from a template or the default of nothing if creating all new
   * Brings in terms from template DB for jumpid, never updated (unless DB template is saved)
   * Will not query glossary/categories, just categories from the taxonomy object
   * Includes free fields
   */
  loadedJumpIDTermsFromDB: GlossaryCategoryDto[];
  /**
   * All templates the user has access to
   */
  templates: Option<TaxonomyTemplateDto>[];
  /**
   * A selected template by the user
   */
  selectedTemplateOption?: Option<TaxonomyTemplateDto>;
  /**
   * A selected client by user or default
   */
  selectedClientOption?: Option<string>;
  /**
   * Whether an alert for successful/unsuccessful template creation/update
   */
  alertOpen: boolean;
  /**
   * Contents of the alert being show to the user
   */
  alertMessage: string;
  /**
   * Whether the "Are you sure you want to delete" dialog is showing
   */
  userDialogOpen: boolean;
  /**
   * Tracks whether the free field editor is open or closed
   */
  freeFieldEditorOpen: boolean;
  /**
   * Contents of a Free Field Category for editing
   */
  freeFieldEditCategory?: GlossaryCategoryDto;
  /**
   * if true template is in select more, otherwise it is in creation mode. Only applies to admin mode
   */
  templateSelectMode?: boolean;
  /**
   * Modes for which parts to show and generate, can be both jumpid or one or the other
   */
  templateGenerateMode: TemplateGenerateMode;
}

enum TemplateGenerateMode {
  BOTH = 'Both',
  JUMPID_ONLY = 'Jump ID Only',
  TAXONOMY_ONLY = 'Campaign Only',
}

class Taxonomator extends React.PureComponent<TaxonomatorProps, TaxonomatorState> {
  private glossaryDao: GlossaryItemDao = new GlossaryItemDao();
  private jumpIDGlossaryDao: GlossaryItemDao = new GlossaryItemDao();
  private templateDao: TaxonomyTemplateDao = new TaxonomyTemplateDao();

  public constructor(props: TaxonomatorProps) {
    super(props);
    this.jumpIDGlossaryDao.setLocation(jumpIDGlossaryLocation);
    this.state = {
      templateGenerateMode: TemplateGenerateMode.BOTH,
      templateName: '',
      teamOptions: [],
      delimiterOptions: [],
      channelOptions: [],
      userSelectedCategoriesAndTerms: [],
      userSelectedJumpIDCategoriesAndTerms: [],
      loadedTermsFromDB: [],
      loadedJumpIDTermsFromDB: [],
      includedCategories: [],
      includedJumpIDCategories: [],
      glossaryCategoryDtos: [],
      glossaryJumpIDCategoryDtos: [],
      allCategoryOptions: [],
      allJumpIDCategoryOptions: [],
      glossaryOptions: [],
      glossaryjumpIDOptions: [],
      draggableCategories: this.getDefaultDraggableFields(),
      draggableJumpIDCategories: this.getDefaultDraggableFields(),
      templates: [],
      alertOpen: false,
      alertMessage: '',
      userDialogOpen: false,
      freeFieldEditorOpen: false,
    };
  }

  /**
   * Returns a blank Fields object
   * @returns
   */
  private getDefaultDraggableFields = (): Fields => {
    return {
      includedFields: {
        id: 'includedFields',
        name: 'Included Fields',
        list: [],
      },
      excludedFields: {
        id: 'excludedFields',
        name: 'Excluded Fields',
        list: [],
      },
    };
  };

  private setTemplateAttributes = (
    selectedCampaignTypeOption?: Option<string>,
    selectedBusinessOption?: Option<string>,
    selectedDelimiterOption?: Option<string>,
    selectedGlossaryOption?: Option<string>,
    selectedGlossaryJumpID?: Option<string>,
  ) => {
    const previousSelectedGlossaryOption = this.state.selectedGlossaryOption;
    const previousSelectedGlossaryJumpIDOption = this.state.selectedGlossaryJumpID;
    this.setState({ selectedCampaignTypeOption, selectedBusinessOption, selectedDelimiterOption, selectedGlossaryOption, selectedGlossaryJumpID });

    // Only modify the draggable fields if the selected glossary has changed
    if (previousSelectedGlossaryOption !== selectedGlossaryOption && selectedGlossaryOption !== undefined) {
      this.getGlossaryCategories(selectedGlossaryOption.value);
    }
    if (previousSelectedGlossaryJumpIDOption !== selectedGlossaryJumpID && selectedGlossaryJumpID !== undefined) {
      this.getGlossaryCategoriesJumpID(selectedGlossaryJumpID.value);
    }
    if (selectedGlossaryOption === undefined || selectedGlossaryJumpID === undefined) {
      return;
    }
    const previousSelecteDelimiterOption = this.state.selectedDelimiterOption;
    // If the delimiter has changed, then check the glossary categories against it
    if (previousSelecteDelimiterOption !== selectedDelimiterOption) {
      const selectedCategories = this.state.allCategoryOptions;
      const delimiter = selectedDelimiterOption !== undefined ? selectedDelimiterOption.value : '';
      const compatibleDelimiter = this.checkTermsAgainstDelimiter(delimiter, selectedCategories);
      if (!compatibleDelimiter) {
        this.setState({ selectedDelimiterOption: undefined });
      }
    }
  };

  /**
   * Gets the fully formatted name of the template
   * @returns
   */
  private getTemplateName = () => {
    const { selectedCampaignTypeOption, selectedGlossaryOption, selectedBusinessOption, templateName } = this.state;
    return this.generateTemplateFullName(selectedCampaignTypeOption?.label, selectedGlossaryOption?.label, selectedBusinessOption?.label, templateName);
  };

  private generateTemplateFullName = (selectedTeam?: string, selectedGlossary?: string, selectedChannel?: string, templateName?: string) => {
    const nameSeperator = ' | ';
    const elements = [
      selectedTeam ? selectedTeam : '_',
      selectedGlossary ? selectedGlossary : '_',
      selectedChannel ? selectedChannel : '_',
    ];
    return elements.join(nameSeperator);
  };

  public componentDidMount() {
    const { taxonomyUserClients } = this.props;
    this.selectDefaultClient(taxonomyUserClients);
  }

  public componentDidUpdate(prevProps: TaxonomatorProps, prevState: TaxonomatorState) {
    const { taxonomyUserClients } = this.props;
    if (prevProps.taxonomyUserClients != taxonomyUserClients) {
      this.selectDefaultClient(taxonomyUserClients);
    }
  }

  /**
   * Sets a default client if one is not selected
   * @param taxonomyUserClients
   */
  private selectDefaultClient = (taxonomyUserClients: Map<string, clientMetadata>) => {
    if (this.state.selectedClientOption !== undefined || taxonomyUserClients.size < 1) {
      return;
    }

    const defaultKey = Array.from(taxonomyUserClients.keys())
      .sort((a, b) => taxonomyUserClients.get(a)?.name.localeCompare(taxonomyUserClients.get(b)?.name || '') || 0)[0];
    if (defaultKey === undefined) {
      return;
    }
    const name = taxonomyUserClients.get(defaultKey)?.name || 'Name missing';
    const selectedClientOption = { label: name, value: defaultKey };
    this.onSelectClient(selectedClientOption);
  };

  private removeDuplicateOptions = (inputOptions: Option<string>[]) => {
    const dupeMap = new Map<string, Option<string>>();
    inputOptions.forEach((option) => dupeMap.set(option.value, option));
    return Array.from(dupeMap.values());
  };

  /**
   * Watch glossaries under client for changes
   * @param clientId
   */
  private watchGlossaries = (clientId: string) => {
    this.glossaryDao.watchForGlossaryChanges(clientId, (glossaryItemDtos) => {
      const glossaryOptions: Option<string>[] = [];
      glossaryItemDtos.forEach((glossaryItemDtos) => {
        glossaryOptions.push({ label: glossaryItemDtos.name, value: glossaryItemDtos.id });
      });
      // If there is just one glossary, select it and query the categories
      const selectedGlossaryOption = glossaryOptions.length === 1 ? glossaryOptions[0] : undefined;
      if (selectedGlossaryOption !== undefined) {
        this.getGlossaryCategories(selectedGlossaryOption.value);
      }
      this.setState({ glossaryOptions, selectedGlossaryOption });
    });
    this.jumpIDGlossaryDao.watchForGlossaryChanges(clientId, (glossaryItemDtos) => {
      const glossaryjumpIDOptions: Option<string>[] = [];
      glossaryItemDtos.forEach((glossaryItemDtos) => {
        glossaryjumpIDOptions.push({ label: glossaryItemDtos.name, value: glossaryItemDtos.id });
      });
      const selectedGlossaryJumpID = glossaryjumpIDOptions.length === 1 ? glossaryjumpIDOptions[0] : undefined;
      if (selectedGlossaryJumpID !== undefined) {
        this.getGlossaryCategoriesJumpID(selectedGlossaryJumpID.value);
      }
      this.setState({ glossaryjumpIDOptions, selectedGlossaryJumpID });
    });
  };

  /**
   * Sets up state for selected client
   * @param selectedClientOption Client ID option
   */
  private onSelectClient = (selectedClientOption: Option<string>) => {
    this.templateDao.watchForChanges(selectedClientOption.value, (templatesDto) => {
      const templates: Option<TaxonomyTemplateDto>[] = templatesDto.map((dto) => {
        return { label: `${this.generateTemplateFullName(dto.campaignType, dto.glossaryName, dto.business, dto.templateName)}`, value: dto };
      });
      const teamOptions = this.removeDuplicateOptions(
        templatesDto.map((dto) => {
          return { label: dto.campaignType, value: dto.campaignType };
        }),
      );
      const channelOptions = this.removeDuplicateOptions(
        templatesDto.map((dto) => {
          return { label: dto.business, value: dto.business };
        }),
      );
      const delimiterOptions = this.removeDuplicateOptions(
        templatesDto.map((dto) => {
          return { label: dto.delimiter, value: dto.delimiter };
        }),
      );

      // If there is only one value, default to it
      let { selectedCampaignTypeOption, selectedBusinessOption, selectedDelimiterOption } = this.state;
      selectedCampaignTypeOption = teamOptions.length === 1 ? teamOptions[0] : selectedCampaignTypeOption;
      selectedBusinessOption = channelOptions.length === 1 ? channelOptions[0] : selectedBusinessOption;
      selectedDelimiterOption = delimiterOptions.length === 1 ? delimiterOptions[0] : selectedDelimiterOption;

      this.setState({
        selectedClientOption,
        templates,
        teamOptions,
        delimiterOptions,
        channelOptions,
        selectedCampaignTypeOption,
        selectedBusinessOption,
        selectedDelimiterOption,
      });
    });

    // Default these on new client selection
    const templateName = ''; // unselect template
    const userSelectedCategoriesAndTerms: GlossaryCategoryDto[] = [];
    const loadedTermsFromDB: GlossaryCategoryDto[] = [];
    const includedCategories: GlossaryCategoryDto[] = [];
    const glossaryCategoryDtos: GlossaryCategoryDto[] = [];
    const allCategoryOptions: GlossaryCategoryDto[] = [];
    const glossaryOptions: Option<string>[] = [];
    const draggableCategories = this.getDefaultDraggableFields();
    const draggableJumpIDCategories = this.getDefaultDraggableFields();

    this.setState(
      {
        selectedClientOption,
        templateName,
        userSelectedCategoriesAndTerms,
        loadedTermsFromDB,
        includedCategories,
        glossaryCategoryDtos,
        allCategoryOptions,
        glossaryOptions,
        draggableCategories,
        draggableJumpIDCategories,
      },
      () => {
        this.watchGlossaries(selectedClientOption.value);
      },
    );
  };

  private setDefaults = () => {
    // Default these on new client selection
    const templateName = ''; // unselect template
    const userSelectedCategoriesAndTerms: GlossaryCategoryDto[] = [];
    const loadedTermsFromDB: GlossaryCategoryDto[] = [];
    const includedCategories: GlossaryCategoryDto[] = [];
    const glossaryCategoryDtos: GlossaryCategoryDto[] = [];
    const allCategoryOptions: GlossaryCategoryDto[] = [];
    const glossaryOptions: Option<string>[] = [];
    const draggableCategories = this.getDefaultDraggableFields();
    const draggableJumpIDCategories = this.getDefaultDraggableFields();

    this.setState(
      {
        templateName,
        selectedTemplateOption: undefined,
        userSelectedCategoriesAndTerms,
        loadedTermsFromDB,
        includedCategories,
        glossaryCategoryDtos,
        allCategoryOptions,
        glossaryOptions,
        draggableCategories,
        draggableJumpIDCategories,
      },
    );
  }

  /**
   * Output the set of Fields for drag and drop based on selected categories and all available categories
   * @param selectedCategories - Selected categries only
   * @param allCategoryOptions - All categories possible
   * @returns
   */
  private createDraggableFields = (includedCategories: GlossaryCategoryDto[], allCategoryOptions: GlossaryCategoryDto[]): Fields => {
    const draggableFields: Fields = {
      includedFields: {
        id: 'includedFields',
        name: 'Included Fields',
        list: [],
      },
      excludedFields: {
        id: 'excludedFields',
        name: 'Excluded Fields',
        list: [],
      },
    };

    const activeFields = new Set(includedCategories.map((dto) => dto.name));
    const inactiveFields = new Set(allCategoryOptions.map((dto) => dto.name).filter((value) => !activeFields.has(value)));

    includedCategories.forEach((dto, value) => {
      draggableFields['includedFields'].list.push({ id: dto.name, text: dto.name, isActive: dto.isActive });
    });

    inactiveFields.forEach((categoryName) => {
      draggableFields['excludedFields'].list.push({ id: categoryName, text: categoryName, isActive: false });
    });

    // Initially sort excluded fields into alphabetical order for usability
    draggableFields['excludedFields'].list.sort((a, b) => (a.text > b.text ? 1 : -1));

    return draggableFields;
  };

  private getGlossaryCategories(glossaryId: string) {
    const { allCategoryOptions, selectedDelimiterOption, userSelectedCategoriesAndTerms } = this.state;
    const glossary = new GlossaryItemDto();
    glossary.id = glossaryId;
    this.glossaryDao.watchForCategoryChanges(glossary, (glossaryCategoryDtos) => {
      // Check for the delimiter compatibilty
      const delimiter = selectedDelimiterOption !== undefined ? selectedDelimiterOption.value : '';
      const compatibleDelimiter = this.checkTermsAgainstDelimiter(delimiter, glossaryCategoryDtos);
      if (compatibleDelimiter) {
        // Basically, whenever a category changes, reload allAvailableCategories with every used/unused free field + everything loaded from the glossary categories DB
        const usedFreeFields = userSelectedCategoriesAndTerms.filter((dto) => dto.freeField === true);
        const unusedFreeFields = allCategoryOptions.filter((dto) => dto.freeField === true);
        let newCategoryList: GlossaryCategoryDto[] = [];
        newCategoryList = newCategoryList.concat(usedFreeFields);
        newCategoryList = newCategoryList.concat(unusedFreeFields);
        newCategoryList = newCategoryList.concat(glossaryCategoryDtos);
        const draggableCategories = this.createDraggableFields(this.state.loadedTermsFromDB, newCategoryList);
        this.setState({ allCategoryOptions: newCategoryList, glossaryCategoryDtos, draggableCategories });
      }
      // If the delimiter check doesn't pass, then set glossary to undefined
      else {
        const draggableCategories: Fields = this.createDraggableFields([], []);
        this.setState({ selectedGlossaryOption: undefined, glossaryCategoryDtos: [], draggableCategories });
      }
    });
  }

  private getGlossaryCategoriesJumpID(glossaryId: string) {
    const { allJumpIDCategoryOptions, userSelectedJumpIDCategoriesAndTerms, loadedJumpIDTermsFromDB } = this.state;
    const glossary = new GlossaryItemDto();
    glossary.id = glossaryId;
    this.jumpIDGlossaryDao.watchForCategoryChanges(glossary, (glossaryJumpIDCategoryDtos) => {
      const usedFreeFields = userSelectedJumpIDCategoriesAndTerms.filter((dto) => dto.freeField === true);
      const unusedFreeFields = allJumpIDCategoryOptions.filter((dto) => dto.freeField === true);
      let newCategoryList: GlossaryCategoryDto[] = [];
      newCategoryList = newCategoryList.concat(usedFreeFields);
      newCategoryList = newCategoryList.concat(unusedFreeFields);
      newCategoryList = newCategoryList.concat(glossaryJumpIDCategoryDtos);
      const draggableJumpIDCategories = this.createDraggableFields(loadedJumpIDTermsFromDB, newCategoryList);
      this.setState({ allJumpIDCategoryOptions: newCategoryList, glossaryJumpIDCategoryDtos, draggableJumpIDCategories });
    });
  }

  /**
   * Save the template on button press
   *
   * @param overWrite Whether to overwrite existing.
   * @param isParent Whether template is parent.
   * @param onSuccess Function called after successful save.
   */
  private templateSave = (overWrite: boolean, isParent: boolean, onSuccess?: () => any) => {
    const {
      selectedBusinessOption,
      selectedCampaignTypeOption,
      selectedGlossaryOption,
      selectedDelimiterOption,
      selectedGlossaryJumpID,
      includedCategories,
      userSelectedCategoriesAndTerms,
      allCategoryOptions,
      selectedClientOption,
      selectedTemplateOption,
      userSelectedJumpIDCategoriesAndTerms,
      includedJumpIDCategories,
      templateName,
    } = this.state;
    const { isAdmin } = this.props;

    const usedCategoryNames = userSelectedCategoriesAndTerms.map((dto) => dto.name);
    const unusedFreeFields = allCategoryOptions.filter((dto) => !usedCategoryNames.includes(dto.name) && dto.freeField);

    const callOnSuccess = () => {
      if (onSuccess) {
        onSuccess();
      }
    };
    if (selectedGlossaryOption === undefined || selectedBusinessOption === undefined || selectedDelimiterOption === undefined ||
      selectedCampaignTypeOption === undefined || selectedGlossaryJumpID === undefined) {
      console.error('Attribute not selected');
      return;
    }
    if (selectedClientOption === undefined) {
      console.error('Client not selected');
      return;
    }
    // Save in DB in the correct order
    const orderedUserSelectedCategoriesAndTerms: GlossaryCategoryDto[] = this.syncOrder(
      includedCategories.map((dto) => dto.name),
      userSelectedCategoriesAndTerms,
    );
    const orderedUserSelectedJumpIDCategoriesAndTerms: GlossaryCategoryDto[] = this.syncOrder(
      includedJumpIDCategories.map((dto) => dto.name),
      userSelectedJumpIDCategoriesAndTerms,
    );

    let parentId = '';
    // If it's a child template selected, don't alter the parentId
    if (selectedTemplateOption != undefined && selectedTemplateOption.value.parentId != '') {
      parentId = selectedTemplateOption.value.parentId;
      // If it's a new child template, then load the parent ID from currently selected
    } else if (isParent == false && selectedTemplateOption != undefined && selectedTemplateOption.value.id != null) {
      parentId = selectedTemplateOption?.value.id;
    }
    let template: TaxonomyTemplateDto;
    template = new TaxonomyTemplateDto(
      selectedClientOption.value,
      isParent,
      templateName,
      selectedBusinessOption.value,
      selectedGlossaryOption.value,
      selectedGlossaryOption.label,
      selectedGlossaryJumpID.value,
      selectedGlossaryJumpID.label,
      orderedUserSelectedCategoriesAndTerms,
      unusedFreeFields,
      orderedUserSelectedJumpIDCategoriesAndTerms,
      selectedDelimiterOption.value,
      selectedCampaignTypeOption.value,
      parentId,
    );

    if (isParent == false && templateName == selectedTemplateOption?.value.templateName && selectedTemplateOption?.value.parent == true) {
      this.setState({ alertOpen: true, alertMessage: 'You must change the template name in order to save a child column' });
      return;
    } else if (isParent == true && isAdmin == false) {
      this.setState({ alertOpen: true, alertMessage: 'You must be an admin to create a parent template' });
    }
    if (overWrite) {
      template.id = selectedTemplateOption?.value.id || null;
      template.creationTime = selectedTemplateOption?.value.creationTime || null;
      const success = this.templateDao.set(template);
      if (success) {
        this.setState(
          {
            alertOpen: true,
            alertMessage: `Template "${this.getTemplateName()}" updated`,
            selectedTemplateOption: { label: this.getTemplateName(), value: template },
          },
          callOnSuccess,
        );
      } else {
        this.setState({ alertOpen: true, alertMessage: 'Error saving template. Please try again or reach out to the engineering team' });
      }
    } else {
      this.templateDao.create(template).then((promiseVal: CreationReturnObject) => {
        if (promiseVal.success) {
          template.id = promiseVal.docId;
          this.setState(
            {
              alertOpen: true,
              alertMessage: `Template "${this.getTemplateName()}" created`,
              selectedTemplateOption: { label: this.getTemplateName(), value: template },
            },
            callOnSuccess,
          );
        } else {
          this.setState({ alertOpen: true, alertMessage: 'Error saving template. Please try again or reach out to the engineering team' });
        }
      });
    }
  };

  private templateDeletePreCheck = () => {
    const { selectedTemplateOption } = this.state;
    if (selectedTemplateOption == undefined) {
      return;
    }
    const template: TaxonomyTemplateDto = selectedTemplateOption.value;
    const childDocs = this.templateDao.listChildren(template.id || '', template.claim.groupId);
    childDocs.then((docs) => {
      if (docs.length == 0) {
        this.setState({ userDialogOpen: true, alertMessage: `Are you sure you want to delete "${this.getTemplateName()}"?` });
      } else {
        this.setState({ userDialogOpen: true, alertMessage: `Deleting "${this.getTemplateName()}" will also delete ${docs.length} child templates. Do you want to proceed?` });
      }
    });
  };

  private templateDelete = (): void => {
    const { selectedTemplateOption } = this.state;
    if (selectedTemplateOption == undefined) {
      throw new Error();
    }
    const template = selectedTemplateOption.value;
    this.templateDao.delete(template).then((promiseBool) => {
      if (promiseBool) {
        this.setState({
          alertOpen: true,
          alertMessage: `Template "${this.getTemplateName()}" has been deleted`,
          selectedTemplateOption: undefined,
          selectedDelimiterOption: undefined,
          selectedBusinessOption: undefined,
          selectedCampaignTypeOption: undefined,
          selectedGlossaryJumpID: undefined,
          templateName: '',
          selectedGlossaryOption: undefined,
          userSelectedCategoriesAndTerms: [],
          loadedTermsFromDB: [],
          includedCategories: [],
          draggableCategories: this.createDraggableFields([], []),
        });
      } else {
        this.setState({ alertOpen: true, alertMessage: `There was an issue deleting template "${template.templateName}". Please contact the Engineering team` });
      }
    });
  };

  /**
   * Called via the child or parent template
   * @param template Can be a child or a parent template
   * @param templateName
   * @param glossaryId
   * @param terms
   */
  private loadTemplateStateHelper = (
    template: TaxonomyTemplateDto,
    templateName: string,
    glossaryId: string | undefined,
    glossaryJumpIDId: string | undefined,
    terms: GlossaryCategoryDto[],
    jumpIDTerms: GlossaryCategoryDto[],
    unusedFreeFields: GlossaryCategoryDto[],
  ) => {
    const selectedGlossaryOption = this.state.glossaryOptions.find((option) => option.value === glossaryId);
    const selectedGlossaryJumpIDOption = this.state.glossaryOptions.find((option) => option.value === glossaryJumpIDId);
    const adjustedSelectedGlossaryOption = { label: selectedGlossaryOption?.label || template.glossaryName, value: template.glossaryId };
    const adjustedSelectedGlossaryJumpIDOption = { label: selectedGlossaryJumpIDOption?.label || template.glossaryJumpIDName, value: template.glossaryJumpIDId };

    this.setState(
      {
        loadedTermsFromDB: terms,
        loadedJumpIDTermsFromDB: jumpIDTerms,
        templateName,
        userSelectedCategoriesAndTerms: terms,
        userSelectedJumpIDCategoriesAndTerms: jumpIDTerms,
        allCategoryOptions: unusedFreeFields,
        selectedBusinessOption: { label: template.business, value: template.business },
        selectedDelimiterOption: { label: template.delimiter, value: template.delimiter },
        selectedCampaignTypeOption: { label: template.campaignType, value: template.campaignType },
        selectedGlossaryOption: adjustedSelectedGlossaryOption,
        selectedGlossaryJumpID: adjustedSelectedGlossaryJumpIDOption,
      },
      () => {
        this.getGlossaryCategories(template.glossaryId);
        this.getGlossaryCategoriesJumpID(template.glossaryJumpIDId);
      },
    );
  };

  /**
   * Loads template into state when template is selected
   * @param template
   */
  private loadTemplate = (template: TaxonomyTemplateDto) => {
    let terms = template.selectedTerms;
    let unusedFreeFields = template.unusedFreeFields || [];

    const compatibleDelimiter = this.checkTermsAgainstDelimiter(template.delimiter, template.selectedTerms);
    // Only continue operations if the delimiter and terms are compatible
    if (compatibleDelimiter) {
      // set everything normally if loading parent template
      if (template.parent) {
        this.loadTemplateStateHelper(template, template.templateName, template.glossaryId, template.glossaryJumpIDId, terms, template.selectedJumpIDTerms, unusedFreeFields);
      }
      // if child template, then load in everything except terms and free fields from Parent
      else {
        const parentPromise = this.templateDao.get(template.parentId);
        parentPromise
          .then((parentTemplate) => {
            this.loadTemplateStateHelper(parentTemplate, template.templateName, parentTemplate.glossaryId, parentTemplate.glossaryJumpIDId, terms, template.selectedJumpIDTerms, unusedFreeFields);
          })
          .catch((e) => {
            console.error(e);
            this.setState({ alertOpen: true, alertMessage: `There was an issue loading the parent template for "${template.templateName}". Please contact the Engineering team.` });
          });
      }
    }
  };

  /**
   * Takes in the included categories and the selected categories and returns the selectedCategories in the correct order
   * @param orderedCategoryNames - string ordered list of category names
   * @param selectedCategories
   */
  private syncOrder = (orderedCategoryNames: string[], selectedCategories: GlossaryCategoryDto[]): GlossaryCategoryDto[] => {
    // Maintain sort for userSelectedCategoriesAndTerms as well
    // This involves skipping when a category is included but not selected
    const orderedUserSelectedCategAndTerms = [];
    for (let k = 0; k < orderedCategoryNames.length; k++) {
      const categoryName = orderedCategoryNames[k];
      const selectedCategory = selectedCategories.filter((dto) => dto.name === categoryName)[0];
      if (selectedCategory !== undefined) {
        orderedUserSelectedCategAndTerms.push(selectedCategory);
      }
    }
    return orderedUserSelectedCategAndTerms;
  };

  /**
   * When the include fields are changed, updates the allCategoryOptions and userSelectedCategoriesAndTerms
   * @param fields
   */
  private onChangeIncludeFields = (fields: Fields) => {
    const { allCategoryOptions } = this.state;
    let { userSelectedCategoriesAndTerms } = this.state;

    const includedCategoryNamesList = fields.includedFields.list;

    // Maintain sort for include fields and check for missing
    const selectedCategoriesInProperOrder: GlossaryCategoryDto[] = [];
    const missingCategories: String[] = [];
    for (let k = 0; k < includedCategoryNamesList.length; k++) {
      const categoryName = includedCategoryNamesList[k].id;
      const category = allCategoryOptions.filter((dto) => dto.name == categoryName)[0];
      category.isActive = includedCategoryNamesList[k].isActive;
      if (category !== undefined) {
        selectedCategoriesInProperOrder.push(category);
      } else {
        missingCategories.push(categoryName);
      }
    }
    if (missingCategories.length > 0) {
      const missingCategoriesText = missingCategories.map((s) => `'${s}'`).join(', ');
      this.setState({
        alertOpen: true,
        alertMessage: `There was an issue loading the following categories: ${missingCategoriesText}. Please modify this template or add the categories back to the glossary`,
      });
    }
    // Remove categories from selected if they are removed from inclusion
    const includedCategoryNames = fields.includedFields.list.map(value => value.id);
    userSelectedCategoriesAndTerms = userSelectedCategoriesAndTerms.filter((selected) => includedCategoryNames.includes(selected.name));
    // End maintain sort

    // set isActive
    userSelectedCategoriesAndTerms.forEach((value) => {
      const category = includedCategoryNamesList.find(item => item.id === value.name);
      if (category !== undefined) {
        value.isActive = category.isActive;
      }
    });

    this.setState({ includedCategories: selectedCategoriesInProperOrder, userSelectedCategoriesAndTerms });
  };

  private onChangeIncludeFieldsJumpID = (fields: Fields) => {
    const { allJumpIDCategoryOptions, userSelectedJumpIDCategoriesAndTerms } = this.state;


    const includedCategoryNamesList = fields.includedFields.list;

    // Maintain sort for include fields and check for missing
    const selectedCategoriesInProperOrder: GlossaryCategoryDto[] = [];
    const missingCategories: String[] = [];
    for (let k = 0; k < includedCategoryNamesList.length; k++) {
      const categoryName = includedCategoryNamesList[k].id;
      const category = allJumpIDCategoryOptions.filter((dto) => dto.name == categoryName)[0];
      category.isActive = includedCategoryNamesList[k].isActive;
      if (category !== undefined) {
        selectedCategoriesInProperOrder.push(category);
      } else {
        missingCategories.push(categoryName);
      }
    }
    if (missingCategories.length > 0) {
      const missingCategoriesText = missingCategories.map((s) => `'${s}'`).join(', ');
      this.setState({
        alertOpen: true,
        alertMessage: `There was an issue loading the following categories: ${missingCategoriesText}. Please modify this template or add the categories back to the glossary`,
      });
    }
    // Remove categories from selected if they are removed from inclusion
    const includedCategoryNames = fields.includedFields.list.map(value => value.id);
    const userSelectedJumpIDCategoriesAndTermsRemoved = userSelectedJumpIDCategoriesAndTerms.filter((selected) => includedCategoryNames.includes(selected.name));
    // End maintain sort
    // set isActive
    userSelectedJumpIDCategoriesAndTermsRemoved.forEach((value) => {
      const category = includedCategoryNamesList.find(item => item.id === value.name);
      if (category !== undefined) {
        value.isActive = category.isActive;
      }
    });

    this.setState({ includedJumpIDCategories: selectedCategoriesInProperOrder, userSelectedJumpIDCategoriesAndTerms: userSelectedJumpIDCategoriesAndTermsRemoved });
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

    const clientOptions: Option<string>[] = Array.from(taxonomyUserClients.keys()).map((key) => {
      return { label: taxonomyUserClients.get(key)?.name || '', value: key };
    });

    return (
      <div className={classes.section}>
        <Paper>
          <Typography className={classes.section} variant="h4">
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

  private generatePreview = () => {
    const { selectedDelimiterOption, includedCategories: includedFields } = this.state;
    const fields = includedFields.map((dto) => dto.name.toUpperCase());
    return fields.join(selectedDelimiterOption?.value);
  };

  private handleAlert = (open: boolean) => {
    this.setState({ alertOpen: open, userDialogOpen: open });
  };

  private handlePrompt = (open: boolean) => {
    this.setState({ userDialogOpen: open });
  };

  private handleTermChange = (userSelectedCategoriesAndTerms: GlossaryCategoryDto[]) => {
    const { includedCategories } = this.state;
    userSelectedCategoriesAndTerms = this.syncOrder(
      includedCategories.map((dto) => dto.name),
      userSelectedCategoriesAndTerms,
    );
    this.setState({ userSelectedCategoriesAndTerms, loadedTermsFromDB: userSelectedCategoriesAndTerms });
  };

  private handleJumpIDTermChange = (userSelectedCategoriesAndTerms: GlossaryCategoryDto[]) => {
    const { includedJumpIDCategories } = this.state;
    const userSelectedJumpIDCategoriesAndTerms = this.syncOrder(
      includedJumpIDCategories.map((dto) => dto.name),
      userSelectedCategoriesAndTerms,
    );
    this.setState({ userSelectedJumpIDCategoriesAndTerms, loadedJumpIDTermsFromDB: userSelectedCategoriesAndTerms });
  };

  private openFreeFieldAdd = () => {
    this.setState({ freeFieldEditorOpen: true, freeFieldEditCategory: undefined });
  };

  private openFreeFieldEdit = (editCategory: GlossaryCategoryDto) => {
    this.setState({ freeFieldEditorOpen: true, freeFieldEditCategory: editCategory });
  };

  /**
   * Writes category changes to the DB for a specified free field
   *
   * @param categoryName
   * @param values
   * @param previousCategoryName
   * @returns true on success
   */
  private writeFreeFieldChanges = (categoryName: string, values: Set<string>, previousCategoryName?: string): boolean => {
    const { allCategoryOptions, includedCategories, userSelectedCategoriesAndTerms } = this.state;

    // Check for duplicates if we are changing category name or creating brand new free field
    if (previousCategoryName !== categoryName && allCategoryOptions.filter((dto) => dto.name === categoryName).length > 0) {
      this.setState({
        alertOpen: true,
        alertMessage: `Cannot add free field '${categoryName}' because a category already exists by that name`,
      });
      return false;
    }

    // Edit existing category
    if (previousCategoryName !== undefined) {
      // Can assume the edited free field will always exist
      // Overwrite existing values
      const editedCategory = allCategoryOptions.filter((dto) => dto.name === previousCategoryName)[0];
      editedCategory.name = categoryName;
      editedCategory.terms = new BiMap<string, string>();
      values.forEach((value) => {
        editedCategory.terms.set(value, value);
      });

      // Copy object over to selected only if it's in there
      userSelectedCategoriesAndTerms.forEach((dto) => {
        if (dto.name === previousCategoryName) {
          dto.name = editedCategory.name;
          dto.terms = editedCategory.terms;
        }
      });
    } else {
      let newFreeField = GlossaryCategoryDto.createFromFreeField(categoryName, values);
      userSelectedCategoriesAndTerms.push(newFreeField);
      includedCategories.push(newFreeField);
      allCategoryOptions.push(newFreeField);
    }

    const draggableCategories = this.createDraggableFields(includedCategories, allCategoryOptions);

    this.setState({ allCategoryOptions, includedCategories, userSelectedCategoriesAndTerms, draggableCategories, freeFieldEditorOpen: false }, () => {
      this.onChangeIncludeFields(draggableCategories);
    });
    return true;
  };

  private deleteFreeField = (category: GlossaryCategoryDto) => {
    const { allCategoryOptions, includedCategories, userSelectedCategoriesAndTerms, selectedTemplateOption } = this.state;
    if (selectedTemplateOption === undefined || allCategoryOptions === undefined || includedCategories === undefined || userSelectedCategoriesAndTerms === undefined) {
      return;
    }
    const newIncludedCategories = includedCategories.filter((cat) => {
      return cat !== category;
    });
    const newAllCategories = allCategoryOptions.filter((cat) => {
      return cat !== category;
    });
    const newUserCategories = userSelectedCategoriesAndTerms.filter((cat) => {
      return cat !== category;
    });
    const draggableCategories = this.createDraggableFields(newIncludedCategories, newAllCategories);
    this.setState(
      {
        allCategoryOptions: newAllCategories,
        userSelectedCategoriesAndTerms: newUserCategories,
        includedCategories: newIncludedCategories,
        draggableCategories,
        freeFieldEditorOpen: false,
      },
      () => {
        this.onChangeIncludeFields(draggableCategories);
      },
    );
  };

  /**
   * Callback to open/close the free field editor
   * @param open
   */
  private handleFreeField = (open: boolean) => {
    this.setState({ freeFieldEditorOpen: open });
  };

  private checkTermsAgainstDelimiter = (delimiter: string, categoriesAndTerms: GlossaryCategoryDto[]): boolean => {
      return true;
  };

  private handleSubmit = (delimiter: string, categoriesAndTerms: GlossaryCategoryDto[], JumpIDCategoriesAndTerms: GlossaryCategoryDto[], team: string, channel: string) => {
    const { generateStringsCallback } = this.props;
    const passesCheck = this.checkTermsAgainstDelimiter(delimiter, categoriesAndTerms);
    if (passesCheck) {
      generateStringsCallback(delimiter, categoriesAndTerms, JumpIDCategoriesAndTerms, team, channel);
    }
  };

  /**
   * Select a template if only one exists otherwise set it to not selected
   */
  private selectTemplateIfOnly = () => {
    const { templates, filterTeamOption, filterChannelOption } = this.state;

    const filteredTemplates = templates
      .filter((t) => t.label.includes(filterTeamOption?.label || ''))
      .filter((t) => t.label.includes(filterChannelOption?.label || ''));
    if (filteredTemplates.length != 1) {
      this.setDefaults();
      return;
    }

    this.setState({ selectedTemplateOption: filteredTemplates[0] }, () => this.loadTemplate(filteredTemplates[0].value));
  }

  private renderTemplateSelect = () => {
    const { templates, selectedTemplateOption, templateSelectMode, templateGenerateMode, filterTeamOption, filterChannelOption, teamOptions, channelOptions } = this.state;
    const { classes, isAdmin } = this.props;
    const filteredTemplates = templates
      .filter((t) => t.label.includes(filterTeamOption?.label || ''))
      .filter((t) => t.label.includes(filterChannelOption?.label || ''));
    if (isAdmin) {
      return (
        <AnalyticsConsumer>
          {({ track }) => (
            <div className={classes.topSection}>
              <Paper>
                <Button
                  onClick={() => {
                    this.setState({ templateSelectMode: false, selectedTemplateOption: undefined, templateName: '' });
                  }}
                  className={classes.section}
                >
                  New Template
                </Button>
                <Button
                  onClick={() => {
                    this.setState({ templateSelectMode: true });
                  }}
                  className={classes.section}
                  disabled={templates.length < 1}
                >
                  Edit Template
                </Button>
                {templateSelectMode && (
                  <div>
                    <Typography className={classes.section} variant="h4">
                      Selected Template
                    </Typography>
                    <div className={classes.section}>
                      <SearchableSelect<Option<TaxonomyTemplateDto>>
                        placeholder={selectedTemplateOption?.label || 'Select an existing template'}
                        loadOptions={(inputValue: string): Promise<Option<TaxonomyTemplateDto>[]> => {
                          return new Promise((resolve) => {
                            resolve(templates.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                          });
                        }}
                        defaultOptions={templates}
                        autoFocus={false}
                        onValueChange={(value) =>
                          this.setState({ selectedTemplateOption: value }, () => {
                            this.loadTemplate(value.value);
                            track('Taxonomy: Select Existing Template');
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </Paper>
            </div>
          )}
        </AnalyticsConsumer>
      );
    } else {
      return (
        <AnalyticsConsumer>
          {({ track }) => (
            <div className={classes.topSection}>
              <Paper>
                <Typography className={classes.section} variant="h4">
                  Selected Mode: {templateGenerateMode}
                </Typography>
                <FormControl className={classes.section}>
                  <RadioGroup
                    aria-labelledby="mode-group"
                    name="controlled-radio-buttons-group"
                    value={templateGenerateMode}
                    row
                    onChange={(value) => {
                      this.setDefaults();
                      this.setState({ templateGenerateMode: value.target.value as TemplateGenerateMode });
                      this.selectTemplateIfOnly();
                    }}
                  >
                    <FormControlLabel value={TemplateGenerateMode.BOTH} control={<Radio />} label={TemplateGenerateMode.BOTH} />
                    <FormControlLabel value={TemplateGenerateMode.TAXONOMY_ONLY} control={<Radio />} label={TemplateGenerateMode.TAXONOMY_ONLY} />
                    <FormControlLabel value={TemplateGenerateMode.JUMPID_ONLY} control={<Radio />} label={TemplateGenerateMode.JUMPID_ONLY} />
                  </RadioGroup>
                </FormControl>
              </Paper>
              <Paper>
                <Typography className={classes.section} variant="h4">
                  Select Filters
                </Typography>
                <div className={classes.section}>
                  <SearchableSelect<Option<string>>
                    placeholder={filterTeamOption?.label || 'Select a Campaign Type'}
                    loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                      return new Promise((resolve) => {
                        resolve(teamOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                      });
                    }}
                    defaultOptions={teamOptions}
                    autoFocus={false}
                    onValueChange={(value) =>
                      this.setState({ filterTeamOption: value }, () => {
                        track('Taxonomy: Select filter for Template');
                        this.selectTemplateIfOnly();
                      })
                    }
                  />
                  <SearchableSelect<Option<string>>
                    placeholder={filterChannelOption?.label || 'Select a Business'}
                    loadOptions={(inputValue: string): Promise<Option<string>[]> => {
                      return new Promise((resolve) => {
                        resolve(channelOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                      });
                    }}
                    defaultOptions={channelOptions}
                    autoFocus={false}
                    onValueChange={(value) =>
                      this.setState({ filterChannelOption: value }, () => {
                        track('Taxonomy: Select filter for Template');
                        this.selectTemplateIfOnly();
                      })
                    }
                  />
                </div>

                {(filteredTemplates.length > 1 && filterChannelOption && filterTeamOption) && (<div>
                <Typography className={classes.section} variant="h4">
                  Select Template
                </Typography>
                <div className={classes.section}>
                  <SearchableSelect<Option<TaxonomyTemplateDto>>
                    placeholder={selectedTemplateOption?.label || 'Select a template'}
                    loadOptions={(inputValue: string): Promise<Option<TaxonomyTemplateDto>[]> => {
                      return new Promise((resolve) => {
                        resolve(filteredTemplates.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                      });
                    }}
                    defaultOptions={filteredTemplates}
                    autoFocus={false}
                    onValueChange={(value) =>
                      this.setState({ selectedTemplateOption: value }, () => {
                        this.loadTemplate(value.value);
                        track('Taxonomy: Select Existing Template');
                      })
                    }
                  />
                </div>
                </div>)}
              </Paper>
            </div>
          )}
        </AnalyticsConsumer>
      );
    }
  };

  /**
   * 
   * @returns true if fields are selected by the normal users for the selected mode
   */
  private isRequiredFieldsSelected = () => {
    const { isAdmin } = this.props;
    const { selectedCampaignTypeOption, selectedDelimiterOption, selectedBusinessOption, userSelectedCategoriesAndTerms, userSelectedJumpIDCategoriesAndTerms, templateGenerateMode } = this.state;
    const useTaxonomy = templateGenerateMode == TemplateGenerateMode.BOTH || templateGenerateMode == TemplateGenerateMode.TAXONOMY_ONLY;
    const useJumpId = templateGenerateMode == TemplateGenerateMode.BOTH || templateGenerateMode == TemplateGenerateMode.JUMPID_ONLY;

    let areValuesSelectedForCategories = true;
    userSelectedCategoriesAndTerms.filter(value => value.isActive).forEach((value) => { areValuesSelectedForCategories = areValuesSelectedForCategories && !value.terms.isEmpty(); }
    );
    const areCampaignValuesSelected = useTaxonomy ? areValuesSelectedForCategories : true;

    let areValuesSelectedForJumpid = true;

    userSelectedJumpIDCategoriesAndTerms.filter(value => value.isActive).forEach((value) => { areValuesSelectedForJumpid = areValuesSelectedForJumpid && !value.terms.isEmpty(); }
    );
    const areJumpidValuesSelected = useJumpId ? areValuesSelectedForJumpid : true;

    const areNormalUserValuesSelected = isAdmin ? true : areJumpidValuesSelected && areCampaignValuesSelected;
    return selectedCampaignTypeOption !== undefined && selectedDelimiterOption !== undefined && selectedBusinessOption !== undefined && areNormalUserValuesSelected;
  };

  public render() {
    const { classes, isAdmin } = this.props;

    const {
      includedCategories,
      glossaryOptions,
      draggableCategories,
      selectedTemplateOption,
      loadedTermsFromDB,
      selectedCampaignTypeOption,
      selectedDelimiterOption,
      selectedBusinessOption,
      selectedGlossaryOption,
      selectedGlossaryJumpID,
      teamOptions,
      delimiterOptions,
      channelOptions,
      userSelectedCategoriesAndTerms,
      alertOpen,
      alertMessage,
      userDialogOpen,
      freeFieldEditorOpen,
      freeFieldEditCategory,
      templateSelectMode,
      draggableJumpIDCategories,
      loadedJumpIDTermsFromDB,
      includedJumpIDCategories,
      userSelectedJumpIDCategoriesAndTerms,
      glossaryjumpIDOptions,
      templateGenerateMode,
    } = this.state;

    const useTaxonomy = templateGenerateMode == TemplateGenerateMode.BOTH || templateGenerateMode == TemplateGenerateMode.TAXONOMY_ONLY;
    const useJumpId = templateGenerateMode == TemplateGenerateMode.BOTH || templateGenerateMode == TemplateGenerateMode.JUMPID_ONLY;
    const requiredFieldsSelected = this.isRequiredFieldsSelected();
    const currentTemplateIsParent = selectedTemplateOption != undefined ? selectedTemplateOption?.value.parent : true;
    return (
      <AnalyticsConsumer>
        {({ instrument, track }) => (
          <div>
            <AlertDialog open={alertOpen} errorMessage={alertMessage} openStatusCallback={this.handleAlert} />
            <FreeFieldModal
              isAdmin={isAdmin}
              open={freeFieldEditorOpen}
              openCallback={this.handleFreeField}
              selectionCallback={this.writeFreeFieldChanges}
              editFreeFieldDto={freeFieldEditCategory}
            />
            <UserConfirmationDialog
              open={userDialogOpen}
              userPrompt={alertMessage}
              openStatusCallback={this.handlePrompt}
              operationCallback={instrument(this.templateDelete, 'Taxonomy: Delete Template')}
            />
            {this.renderClientSelect()}
            {this.renderTemplateSelect()}

            {(templateSelectMode !== undefined || !isAdmin) && (
              <div>
                <div className={classes.section}>
                  <Paper>
                    <Typography className={classes.section} variant="h4">
                      Template Name
                    </Typography>
                    <Typography className={classes.section} variant="h5">
                      {this.getTemplateName()}
                    </Typography>
                  </Paper>
                </div>
                <SelectTemplateAttributes
                  selectedCampaignTypeValue={selectedCampaignTypeOption}
                  selectedBusinessValue={selectedBusinessOption}
                  selectedDelimiterValue={selectedDelimiterOption}
                  selectedGlossaryValue={selectedGlossaryOption}
                  selectedGlossaryJumpID={selectedGlossaryJumpID}
                  teamOptions={teamOptions}
                  channelOptions={channelOptions}
                  delimiterOptions={delimiterOptions}
                  glossaryOptions={glossaryOptions}
                  glossaryJumpIDOptions={glossaryjumpIDOptions}
                  onChange={this.setTemplateAttributes}
                  isAdmin={isAdmin}
                />
                {(useTaxonomy) && (<div>
                  <DraggableFields initialFields={draggableCategories} onChange={this.onChangeIncludeFields} isDragDisabled={!isAdmin} />
                  {isAdmin && (
                    <Box textAlign="center">
                      <Button disabled={selectedGlossaryOption === undefined} onClick={() => this.openFreeFieldAdd()}>
                        Add Free Field
                      </Button>
                    </Box>
                  )}
                  <div className={classes.section}>
                    <Paper>
                      <Typography className={classes.section} variant="h4">
                        Preview
                      </Typography>
                      <Typography className={classes.section} style={{ paddingBottom: 8 }} variant="h5">
                        {this.generatePreview() || 'Please select fields'}
                      </Typography>
                    </Paper>
                  </div>
                </div>)}
                <SelectTerms
                  onChange={(userSelectedCategories) => {
                    this.handleTermChange(userSelectedCategories);
                  }}
                  initialTerms={loadedTermsFromDB}
                  allOptions={includedCategories}
                  editCategoryCallback={this.openFreeFieldEdit}
                  deleteCategoryCallback={this.deleteFreeField}
                  isAdmin={isAdmin}
                  isSelect={false}
                  isEnabled={useTaxonomy}
                />
                {(useJumpId) && (<div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography className={classes.section} variant="h4">
                      Jump ID Fields
                    </Typography>
                  </div>
                  <DraggableFields initialFields={draggableJumpIDCategories} onChange={this.onChangeIncludeFieldsJumpID} isDragDisabled={!isAdmin} />
                </div>)}
                <SelectTerms
                  onChange={(userSelectedCategories) => {
                    this.handleJumpIDTermChange(userSelectedCategories);
                  }}
                  initialTerms={loadedJumpIDTermsFromDB}
                  allOptions={includedJumpIDCategories}
                  editCategoryCallback={this.openFreeFieldEdit}
                  deleteCategoryCallback={this.deleteFreeField}
                  isAdmin={isAdmin}
                  isSelect={true}
                  isEnabled={useJumpId}
                />
                <div className={classes.section}>
                  <Paper>
                    {isAdmin && (
                      <Button
                        onClick={() => this.templateSave(false, true, () => track('Taxonomy: Save New Parent Template'))}
                        className={classes.section}
                        disabled={!requiredFieldsSelected}
                      >
                        Save new Template
                      </Button>
                    )}
                    <Button
                      disabled={!requiredFieldsSelected || selectedTemplateOption === undefined || (currentTemplateIsParent && !isAdmin)}
                      onClick={() => this.templateSave(true, currentTemplateIsParent, () => track('Taxonomy: Save Existing'))}
                      className={classes.section}
                    >
                      Save existing
                    </Button>
                    <Button
                      disabled={selectedTemplateOption === undefined || (currentTemplateIsParent && !isAdmin)}
                      onClick={this.templateDeletePreCheck}
                      className={classes.section}
                    >
                      Delete Template
                    </Button>
                    <Button
                      disabled={!requiredFieldsSelected || userSelectedCategoriesAndTerms === undefined || userSelectedCategoriesAndTerms.length === 0}
                      onClick={() => {
                        track('Taxonomy: Generate Strings');
                        this.handleSubmit(
                          selectedDelimiterOption?.value || '',
                          useTaxonomy ? userSelectedCategoriesAndTerms : [],
                          useJumpId ? userSelectedJumpIDCategoriesAndTerms : [],
                          selectedCampaignTypeOption?.value || '',
                          selectedBusinessOption?.value || '',
                        );
                      }}
                      className={classes.section}
                    >
                      Generate Taxonomy
                    </Button>
                  </Paper>
                </div>
              </div>
            )}
          </div>
        )}
      </AnalyticsConsumer>
    );
  }
}

export default withStyles(styles)(Taxonomator);
