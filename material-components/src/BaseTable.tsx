import MaterialTable, { MaterialTableProps } from '@material-table/core';
import React, { forwardRef } from 'react';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import { withTheme, WithTheme as WithThemeProps } from '@material-ui/core';
import { CSSProperties } from 'react';

const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref as any} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref as any} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref as any} />),
  Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref as any} />),
  DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref as any} />),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref as any} />),
  Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref as any} />),
  Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref as any} />),
  FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref as any} />),
  LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref as any} />),
  NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref as any} />),
  PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref as any} />),
  ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref as any} />),
  Search: forwardRef((props, ref) => <Search {...props} ref={ref as any} />),
  SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref as any} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref as any} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref as any} />),
};

interface BaseTableProps<T extends Object> extends WithThemeProps, MaterialTableProps<T> {}

/**
 * Wrapper to add in icons, logging, and style if needed to a base table
 */
class BaseTable<T extends Object> extends React.PureComponent<BaseTableProps<T>, {}> {
  public render() {
    const { components, options, theme } = this.props;
    const fontSize = theme.typography.fontSize;

    const headerStyleDefault: CSSProperties = {
      backgroundColor: theme.palette.background.default,
      fontWeight: 'bold',
      fontSize,
      lineHeight: 'normal',
      zIndex: 0,
    };

    return (
      <MaterialTable
        {...this.props}
        icons={tableIcons as any}
        components={{ Container: (props) => <div {...props} />, ...components }}
        options={{ headerStyle: headerStyleDefault, padding: 'dense', searchFieldStyle: { fontSize }, ...options }}
      />
    );
  }
}

export default withTheme(BaseTable);
