import { Button, Typography, useTheme } from '@material-ui/core';
import { BaseTable, BiMap, BiMapBuilder } from '@mightyhive/material-components';
import React from 'react';
import { GlossaryCategoryDto } from './db/GlossaryItemDto';
import { invalidCodeRegex } from './InputRegex';

interface GlossaryTableProps {
  glossaryCategoryDto: GlossaryCategoryDto;
  onUpdateCategory: (glossaryCategoryDto: GlossaryCategoryDto) => void;
  onDeleteCategory: (glossaryCategoryDto: GlossaryCategoryDto) => void;
}

/**
 * Table row for terms
 */
interface IDataRow {
  code: string; // Code for category entry
  name: string; // Name for category entry
}

/**
 * Old data rows contain table data info
 */
interface IDataRowOld extends IDataRow {
  tableData: {
    id: number;
  };
}

/**
 * Single glossary table with callback for changes
 * @param props
 * @returns
 */
const GlossaryTable = (props: GlossaryTableProps) => {
  const { glossaryCategoryDto, onUpdateCategory, onDeleteCategory } = props;
  const theme = useTheme();
  const glossaryTerms = glossaryCategoryDto.terms;
  const data: IDataRow[] = [];

  if (glossaryTerms !== undefined) {
    glossaryTerms.forEach((value, key) => {
      data.push({
        name: key,
        code: value,
      });
    });
  }

  /**
   * Convert data table rows to Map data type used by DTO.
   * Forcefully overwrites any data for existing key/value.
   * Cleans any codes of spaces
   * @param rows
   * @returns
   */
  const convertDataRowToDtoMap = (rows: IDataRow[]): BiMap<string, string> => {
    const terms = new BiMapBuilder<string, string>().empty();
    for (let k = 0; k < rows.length; k++) {
      const category = rows[k];
      terms.forceSet(category.name.trim(), category.code.trim());
    }
    return terms;
  };

  return (
    <div key={`category-table-${glossaryCategoryDto.id}`} style={{ marginLeft: theme.spacing(1), marginRight: theme.spacing(1), display: 'flex', flexDirection: 'column' }}>
      <Typography display="inline" variant="h5">
        {glossaryCategoryDto.name}
      </Typography>
      <BaseTable
        title={glossaryCategoryDto.name}
        columns={[
          { title: 'Name', field: 'name', defaultSort: 'asc' },
          { title: 'Code', field: 'code' },
        ]}
        data={data}
        options={{
          pageSize: 5,
          showTitle: false,
          // Make table size static so they're aligned
          minBodyHeight: '350px',
          maxBodyHeight: '350px',
        }}
        editable={{
          onRowAdd: (newDataAny: any) =>
            new Promise<void>((resolve, reject) => {
              const newData = newDataAny as IDataRow;
              newData.code = newData.code.replace(invalidCodeRegex, '');

              // Skip if any fields are missing or empty
              if (!newData.name || !newData.name.trim() || !newData.code || !newData.code.trim()) {
                resolve();
                return;
              }

              const dataUpdate = [...data, newData];
              glossaryCategoryDto.terms = convertDataRowToDtoMap(dataUpdate);
              onUpdateCategory(glossaryCategoryDto);
              resolve();
            }),
          onRowUpdate: (newDataAny: any, oldDataAny?: any) =>
            new Promise<void>((resolve, reject) => {
              // Skip if there is no old data to delete (odd case)
              if (oldDataAny === undefined) {
                resolve();
                return;
              }
              const newData = newDataAny as IDataRow;
              const oldData = oldDataAny as IDataRowOld;
              newData.code = newData.code.replace(invalidCodeRegex, '');

              // Skip if any fields are missing or empty for newData
              if (!newData.name || !newData.name.trim() || !newData.code || !newData.code.trim()) {
                resolve();
                return;
              }

              // Skip when there is no change
              if (oldData.code == newData.code && oldData.name == newData.name) {
                resolve();
                return;
              }

              const dataUpdate = [...data];
              dataUpdate[oldData.tableData.id] = newData;
              glossaryCategoryDto.terms = convertDataRowToDtoMap(dataUpdate);
              onUpdateCategory(glossaryCategoryDto);
              resolve();
            }),
          onRowDelete: (oldDataAny: any) =>
            new Promise<void>((resolve, reject) => {
              const oldData = oldDataAny as IDataRowOld;
              const dataUpdate = [...data];

              dataUpdate.splice(oldData.tableData.id, 1);
              glossaryCategoryDto.terms = convertDataRowToDtoMap(dataUpdate);
              onUpdateCategory(glossaryCategoryDto);
              resolve();
            }),
        }}
      />
      <Button onClick={() => onDeleteCategory(glossaryCategoryDto)}>Delete Field '{glossaryCategoryDto.name}'</Button>
    </div>
  );
};

interface GlossaryTablesProps {
  glossaryCategoryDtos: GlossaryCategoryDto[];
  onUpdateCategory: (glossaryCategoryDto: GlossaryCategoryDto) => void;
  onDeleteCategory: (glossaryCategoryDto: GlossaryCategoryDto) => void;
}

const GlossaryTables = (props: GlossaryTablesProps) => {
  const { glossaryCategoryDtos, onUpdateCategory, onDeleteCategory } = props;

  return (
    <div style={{ display: 'flex' }}>
      {glossaryCategoryDtos.map((glossaryCategoryDto) => {
        return <GlossaryTable onUpdateCategory={onUpdateCategory} onDeleteCategory={onDeleteCategory} glossaryCategoryDto={glossaryCategoryDto} key={glossaryCategoryDto.name} />;
      })}
    </div>
  );
};

export default GlossaryTables;
