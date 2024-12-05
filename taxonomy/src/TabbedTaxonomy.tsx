import { createStyles, Divider, Tab, Tabs, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import { AnalyticsConsumer, LogOnMount } from '@mightyhive/analytics';
import React from 'react';
import { jumpIDGlossaryLocation, taxonomyGlossaryLocation } from './db/GlossaryItemDao';
import { GlossaryCategoryDto } from './db/GlossaryItemDto';
import { TaxonomyUserDao } from './db/TaxonomyUserDao';
import { GeneratedTaxonomyDao } from './db/GeneratedTaxonomyDao';
import { clientMetadata } from './db/TaxonomyUserDto';
import GeneratedStringsTable from './GeneratedStringsTable';
import Glossary from './Glossary';
import Taxonomator from './Taxonomator';
import UserManagement from './UserManagement';
import GeneratedTaxonomyDto from './db/GeneratedTaxonomyDto';
import { BiMap } from '@mightyhive/material-components';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(4),
      flexGrow: 1,
    },
    page: {
      margin: theme.spacing(2),
    },
    tab: {
      textTransform: 'none',
      minWidth: 200,
      marginRight: theme.spacing(4),
      '&:hover': {
        color: theme.palette.primary.main,
        opacity: 1,
      },
      '&$selected': {
        color: theme.palette.primary.main,
        fontWeight: theme.typography.fontWeightBold,
      },
      '&:focus': {
        color: theme.palette.primary.main,
      },
    },
    selected: {},
  });
interface TabbedTaxonomyState {
  /**
   * Current tab of the page
   */
  tabIndex: number;
  /**
   * Map of client ids to client names for the user, populated on mount
   */
  taxonomyUserClients: Map<string, clientMetadata>;
  /**
   * Rows for generating strings
   */
  tableData: { [key: string]: object; }[]
  tableColumns: { field: string; title: string; }[];
  /**
   * true if the user is an admin for any client or super admin
   */
  isAdmin: boolean;
}
interface TabbedTaxonomyProps extends WithStyles<typeof styles> {
  /**
   * user userid used for setting default filter to that user
   */
  userid: string;
  /**
   * Firebase token used to get platform spend data
   */
  bearerToken: string;
  /**
   * If the user has access
   */
  isUserApproved: boolean;
}

// If a category has no values, then we have to substitute X as a placeholder during taxonomy generation
const PLACEHOLDER_FOR_BLANK_CATEGORY = 'X';
class TabbedTaxonomy extends React.Component<TabbedTaxonomyProps, TabbedTaxonomyState> {
  // Used for getting a list of clients the user has access to on mount
  taxonomyUserDao = new TaxonomyUserDao();
  // Used to write out archives of generated taxonomy
  generatedTaxonomyDao = new GeneratedTaxonomyDao();
  constructor(props: TabbedTaxonomyProps) {
    super(props);
    this.state = {
      taxonomyUserClients: new Map<string, clientMetadata>(),
      tableData: [],
      tableColumns: [],
      tabIndex: 0,
      isAdmin: false,
    };
  }

  private setTabIndex = (tabIndex: number) => {
    this.setState({ tabIndex });
  };

  public async componentDidMount() {
    const taxonomyUserDto = await this.taxonomyUserDao.get(this.props.userid);
    if (taxonomyUserDto === undefined) {
      return;
    }
    const taxonomyUserClients = new Map<string, clientMetadata>();
    Object.keys(taxonomyUserDto.clients).forEach((key) => {
      taxonomyUserClients.set(key, taxonomyUserDto.clients[key]);
    });
    const isAdmin = taxonomyUserDto.admin || taxonomyUserDto.superAdmin || false;
    this.setState({ taxonomyUserClients, isAdmin });
  }

  private handleInputs = (delimiter: string, selectedCategories: GlossaryCategoryDto[], userSelectedJumpIDCategories: GlossaryCategoryDto[], platform: string, hierarchy: string): void => {
    const jumpIDColumn = userSelectedJumpIDCategories.map((value) => {
      return value.isActive ? value.terms.values().values().next().value as string : 'xx';
    });
    const stringColKey = 'Taxonomy String';
    const jumpIDColKey = 'JumpID';
    let tableData: { [key: string]: object }[];
    let selectedTermsArr: string[][] = [];

    for (let i = 0; i < selectedCategories.length; i++) {
      const category = selectedCategories[i].deepCopy();
      // Handle adding X for blank categories as a placeholder
      if (category.terms.size() === 0 || !category.isActive) {
        category.terms = new BiMap<string, string>();
        category.terms.set(PLACEHOLDER_FOR_BLANK_CATEGORY, PLACEHOLDER_FOR_BLANK_CATEGORY);
      }

      selectedTermsArr.push(Array.from(category.terms.values())); // Write codes
    }
    let result: string[][] = [[]];
    for (const terms of selectedTermsArr) {
      const tempResult: string[][] = [];
      for (const innerTerms of result) {
        for (const term of terms) {
          const newRow = innerTerms.slice();
          newRow.push(term);
          tempResult.push(newRow);
        }
      }
      result = tempResult;
    }
    let archiveJumpId = "";
    const archiveStringArray: string[] = [];
    tableData = result.map((row, index) => {
      const rowObject = {};
      const taxonomyString = row.join(delimiter);
      rowObject[stringColKey] = taxonomyString;
      archiveStringArray.push(taxonomyString);
      archiveJumpId = rowObject[jumpIDColKey] = jumpIDColumn.join('');
      row.forEach((term, index) => (rowObject[selectedCategories[index].name] = term));
      return rowObject;
    });

    const tableColumns = selectedCategories.map((val, index) => {
      return { field: val.name, title: val.name };
    });
    tableColumns.push({ field: stringColKey, title: stringColKey });
    tableColumns.push({ field: jumpIDColKey, title: jumpIDColKey });
    this.generatedTaxonomyDao.create(new GeneratedTaxonomyDto(this.props.userid, delimiter, archiveJumpId, archiveStringArray, selectedCategories));
    this.setState({ tableColumns, tableData });
    this.setTabIndex(1);
  };

  public render() {
    const { tabIndex, taxonomyUserClients, isAdmin, tableColumns, tableData } = this.state;
    const { classes, userid, isUserApproved } = this.props;
    const analyticsNameMap: Record<number, string> = {
      0: 'Page View: Taxonomy Generator',
      1: 'Page View: Taxonomy Results',
      2: 'Page View: Template Administration',
      3: 'Page view: Taxonomy Glossary',
      4: 'Page view: Taxonomy Jump ID Glossary',
      5: 'Page View: Taxonomy User Management',
    };
    const isResultsAvailible = tableData.length > 0;

    if (isUserApproved) {
      return (
        <div className={classes.root}>
          <div>
            <AnalyticsConsumer>
              {({ track }) => (
                <Tabs
                  value={tabIndex}
                  onChange={(e, v) => {
                    this.setTabIndex(v);
                    track(`Taxonomy Tab: ${analyticsNameMap[v]}`);
                  }}
                >
                  <Tab classes={{ selected: classes.selected }} className={classes.tab} disableRipple label="Taxonomy Generator" />
                  <Tab className={classes.tab} disableRipple disabled={!isResultsAvailible} label="Taxonomy Results" />
                  {isAdmin && <Tab classes={{ selected: classes.selected }} className={classes.tab} disableRipple label="Template Administration" />}
                  {isAdmin && <Tab className={classes.tab} disableRipple label="Glossary" />}
                  {isAdmin && <Tab className={classes.tab} disableRipple label="Jump ID Glossary" />}
                  {isAdmin && <Tab className={classes.tab} disableRipple label="User Management" />}
                </Tabs>
              )}
            </AnalyticsConsumer>
          </div>
          <Divider />
          <div>
            {/* LogOnMount to log page view on page load */}
            <LogOnMount eventName={analyticsNameMap[tabIndex]} />
            {tabIndex === 0 && <Taxonomator taxonomyUserClients={taxonomyUserClients} generateStringsCallback={this.handleInputs} isAdmin={false} />}
            {tabIndex === 1 && <GeneratedStringsTable tableColumns={tableColumns} tableData={tableData} />}
            {tabIndex === 2 && <Taxonomator taxonomyUserClients={taxonomyUserClients} generateStringsCallback={this.handleInputs} isAdmin={true} />}
            {tabIndex === 3 && <Glossary taxonomyUserClients={taxonomyUserClients} glossaryLocation={taxonomyGlossaryLocation} />}
            {tabIndex === 4 && <Glossary taxonomyUserClients={taxonomyUserClients} glossaryLocation={jumpIDGlossaryLocation} />}
            {tabIndex === 5 && <UserManagement userid={userid} />}
          </div>
        </div>
      );
    } else {
      return (
        <div className={classes.page}>
          <Typography variant="h4">
            Please contact a super admin for taxonomy to grant you access.
          </Typography>
        </div>
      );
    }
  }
}

export default withStyles(styles)(TabbedTaxonomy);
