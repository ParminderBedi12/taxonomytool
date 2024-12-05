import { BaseTable } from '@mightyhive/material-components';
import { MaterialTableProps } from '@material-table/core';
import React from 'react';

class GeneratedStringsSubtable<T extends object> extends React.PureComponent<MaterialTableProps<T>> {
  public render() {
    return <BaseTable {...(this.props as any)} />;
  }
}

export default GeneratedStringsSubtable;
