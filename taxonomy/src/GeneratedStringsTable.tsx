import { ExportCsv } from '@material-table/exporters';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import React from 'react';
import GeneratedStringsSubtable from './GeneratedStringsSubTable';

interface GeneratedStringsTableProps {
  tableData: {
    [key: string]: object;
  }[];
  tableColumns: any;

}

function GeneratedStringsTable(props: GeneratedStringsTableProps) {

  return (
    <AnalyticsConsumer>
      {({ instrument, track }) => (
        <GeneratedStringsSubtable
          data={props.tableData}
          columns={props.tableColumns}
          style={{
            paddingTop: '10px',
            paddingLeft: '10px',
            paddingRight: '20px',
            paddingBottom: '10px',
            overflowX: 'auto',
            lineHeight: '1.43',
            minWidth: '1000px',
          }}
          options={{
            tableLayout: 'auto',
            showTitle: false,
            exportAllData: true,
            exportMenu: [
              {
                label: 'Export CSV',
                exportFunc: instrument((cols, datas) => ExportCsv(cols, datas, 'TaxonomyOutput'), 'Taxonomy Results: Export Strings'),
              },
            ],
          }}
          onChangePage={(page) => track('Privacy: Next/Prev Buttons', { Page: page })}
          onChangeRowsPerPage={(pageSize) => track(`Taxonomy Results: Rows Selection`, { pageSize })}
          onOrderChange={(orderBy) => {
            const eventProperties = props.tableColumns[orderBy] ? { 'Sort Method': props.tableColumns[orderBy].title } : undefined;
            track('Taxonomy Results: Sort', eventProperties);
          }}
        />
      )}
    </AnalyticsConsumer>
  );
}

export default GeneratedStringsTable;
