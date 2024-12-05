import { Button, IconButton, Input } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { BiMapBuilder, Option } from '@mightyhive/material-components';
import React from 'react';
import { ClaimDto } from './db/ClaimDto';
import { GlossaryItemDao } from './db/GlossaryItemDao';
import { GlossaryCategoryDto, GlossaryItemDto } from './db/GlossaryItemDto';
import { invalidCodeRegex } from './InputRegex';

const HEADER_NAME_END = '_Name';
const HEADER_CODE_END = '_Code';

const FILETYPE = 'csv';

export type FeedbackCallback = (message: string, error?: boolean) => void;

interface ButtonProps {
  glossaryDao: GlossaryItemDao;
  /**
   * Callback passed in from Taxonomator component to alert user to errors or success
   */
  feedbackCallback: FeedbackCallback;
  /**
   * Callback to open the help dialog
   */
  openHelpCallback: () => void;
  /**
   * Glossary objects are connected to Clients, so the ID is required for new object creation
   */
  clientId: string;
  /**
   * Callback to make uploaded glossary currently selected glossary
   */
  selectionCallback: (glossary: Option<GlossaryItemDto>) => void;
}

function UploadButton(props: ButtonProps) {
  const { clientId, glossaryDao, feedbackCallback, openHelpCallback } = props;
  const handleUpload = (event: React.ChangeEvent) => {
    const inputElem = event.target as HTMLInputElement;
    // This is the case when a user closes the upload window without selecting a file
    if (inputElem.files!.length == 0) {
      return;
    }
    const selectedFile = inputElem.files![0];
    if (selectedFile.type !== 'text/csv') {
      // Resetting the input element so that the same file can be selected again
      inputElem.value = '';
      feedbackCallback('Uploaded file must be a CSV. Please check your file format and try again', true);
      return;
    }
    const fileName = selectedFile.name;
    let glossaryName: string;
    if (fileName.endsWith(`.${FILETYPE}`)) {
      glossaryName = fileName.substring(0, fileName.length - `.${FILETYPE}`.length);
    } else {
      glossaryName = fileName;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const stringCsv = reader.result;
      if (stringCsv == null || stringCsv == '') {
        feedbackCallback('The uploaded file appears to be empty. Please check the file and try again', true);
        // Resetting the input element so that the same file can be selected again
        inputElem.value = '';
        return;
      }
      const stupidBetweenType: string = stringCsv as string;
      const parsedCsv = parseCsv(stupidBetweenType, ',', '\r');
      // checking to make sure there are an even number of columns
      if (parsedCsv[0].length % 2 != 0) {
        feedbackCallback('Detected an odd number of columns. Please make sure each field has a corresponding _Name and _Code column', true);
        inputElem.value = '';
        return;
      }
      // checking for properly formatted columns
      const headerRow = parsedCsv[0];
      for (let i = 0; i < headerRow.length; i += 2) {
        const colunmName = headerRow[i].toLocaleLowerCase();
        const columnCode = headerRow[i + 1].toLocaleLowerCase();
        if (!colunmName.endsWith(HEADER_NAME_END.toLocaleLowerCase()) || !columnCode.endsWith(HEADER_CODE_END.toLocaleLowerCase())) {
          feedbackCallback(
            `The uploaded file does not have properly formatted column headers. Please make sure each column ends in "${HEADER_NAME_END}" or "${HEADER_CODE_END}" as appropriate`,
            true,
          );
          // Resetting the input element so that the same file can be selected again
          inputElem.value = '';
          return;
        }
      }
      const uniqueCategories = validateCategoryUniqueness(parsedCsv);
      // Break out of function before creating any objects in firebase if categories aren't unique
      if (!uniqueCategories) {
        inputElem.value = '';
        return;
      }
      const transposedArray = transposeArray(parsedCsv);
      const categories: GlossaryCategoryDto[] | string[] = convertToCategories(transposedArray);
      if (categories.length == 0) {
        feedbackCallback('No categories read from file, please check file for errors', true);
      } else if (typeof categories[0] === 'string') {
        const errorString = categories.join('\n');
        feedbackCallback(errorString, true);
      } else {
        const newGlossary = new GlossaryItemDto();
        newGlossary.name = glossaryName.trim();
        newGlossary.claim = new ClaimDto(null, clientId);

        uploadGlossary(newGlossary, categories as GlossaryCategoryDto[]);
      }

      // Resetting the input element so that the same file can be selected again
      inputElem.value = '';
    };
    reader.readAsText(selectedFile);
  };

  // Parsing function comes from this SO post: https://stackoverflow.com/a/60219936
  const parseCsv = (data: string, fieldSep: string, newLine: string) => {
    fieldSep = fieldSep || ',';
    newLine = newLine || '\n';
    let nSep = '\x1D';
    let qSep = '\x1E';
    let cSep = '\x1F';
    let nSepRe = new RegExp(nSep, 'g');
    let qSepRe = new RegExp(qSep, 'g');
    let cSepRe = new RegExp(cSep, 'g');
    let fieldRe = new RegExp('(?<=(^|[' + fieldSep + '\\n]))"(|[\\s\\S]+?(?<![^"]"))"(?=($|[' + fieldSep + '\\n]))', 'g');
    let grid: string[][] = [];
    data
      .replace(/\r/g, '')
      .replace(/\n+$/, '')
      .replace(fieldRe, function (match, p1, p2) {
        return p2.replace(/\n/g, nSep).replace(/""/g, qSep).replace(/,/g, cSep);
      })
      .split(/\n/)
      .forEach(function (line) {
        let row = line.split(fieldSep).map(function (cell) {
          return cell.replace(nSepRe, newLine).replace(qSepRe, '"').replace(cSepRe, ',').trim();
        });
        grid.push(row);
      });
    return grid;
  };

  /**
   * Taking a solution from this SO post: https://stackoverflow.com/questions/4492678/swap-rows-with-columns-transposition-of-a-matrix-in-javascript
   * @param inputArr result of reading in the uploaded CSV
   */
  const transposeArray = (inputArr: string[][]): string[][] => {
    const outputArr: string[][] = [];
    for (let i = 0; i < inputArr.length; i++) {
      for (let j = 0; j < inputArr[i].length; j++) {
        if (inputArr[i][j] === undefined) {
          continue;
        }
        if (outputArr[j] === undefined) {
          outputArr[j] = [];
        }
        outputArr[j][i] = inputArr[i][j];
      }
    }
    return outputArr;
  };

  /**
   * Convert column number to format you'd see in excel/etc
   *
   * Examples:
   * 1 -> A
   * 2 -> B
   * 27 -> AA
   *
   * @param num
   * @returns
   */
  const numToSpreadsheetColumn = (num: number): string => {
    let letters = '';
    while (num >= 0) {
      letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters;
      num = Math.floor(num / 26) - 1;
    }
    return letters;
  };

  /**
   * Converts csv to categories
   *
   * 2D Array format of ParsedCsv
   *
   *  0: (3) ['Geo_Name', 'Geodude', 'Geodude1']
   *  1: (3) ['Geo_Code', 'GEO_DUDE', 'GEO_DUDE2']
   *  2: (3) ['ABC_Name', 'ABC', 'ABC2']
   *  3: (3) ['ABC_Code', 'CODE1', 'CODE2']
   *
   * @param parsedCsv
   * @returns either list of Categories, or list of errors
   */
  const convertToCategories = (parsedCsv: string[][]): GlossaryCategoryDto[] | string[] => {
    const glossaryCategoriesDto: GlossaryCategoryDto[] = [];

    const errors: string[] = [];

    // Iterate over pairs of columns
    for (let k = 0; k < parsedCsv.length; k += 2) {
      // No need to check column header formatting, already checked
      const nameColumn = parsedCsv[k];
      const codeColumn = parsedCsv[k + 1];
      let newDto = new GlossaryCategoryDto();

      newDto.name = nameColumn[0].substring(0, nameColumn[0].length - HEADER_NAME_END.length);
      newDto.terms = new BiMapBuilder<string, string>().empty();

      if (nameColumn.length != codeColumn.length) {
        console.error('Column length wrong for');
      }

      // Start at 1 to skip header. Iterate over all column value pairs
      for (let j = 1; j < nameColumn.length; j++) {
        const name = nameColumn[j];
        const code = codeColumn[j];
        if (name == '' && code == '') {
          // Skip pair of blanks
          continue;
        } else if (name == '' || code == '') {
          let msg = '';
          if (name == '') {
            msg = `Name is blank in column '${numToSpreadsheetColumn(k)}' row ${j}.`;
          } else if (code == '') {
            msg = `Code is blank in column '${numToSpreadsheetColumn(k + 1)}' row ${j}.`;
          }
          errors.push(msg);
          continue;
        } else if (code.search(invalidCodeRegex) !== -1) {
          const msg = `Codes cannot contain spaces. Remove spaces from code '${code}' in column '${numToSpreadsheetColumn(k + 1)}' row ${j}.`;
          errors.push(msg);
          continue;
        }

        if (newDto.terms.getByKey(name) === undefined && newDto.terms.getByValue(code) === undefined) {
          // Add if neither is in the map
          newDto.terms.set(name, code);
        } else if (newDto.terms.getByKey(name) !== undefined && newDto.terms.getByValue(code) !== undefined) {
          // Skip if the pair is already in the map
          continue;
        } else {
          // Only one pair is already in the map
          let msg = '';
          if (newDto.terms.getByKey(name) === undefined) {
            msg = `Code '${code}' is already paired with another value. Column '${numToSpreadsheetColumn(k + 1)}' row ${j}.`;
          } else if (newDto.terms.getByValue(code) === undefined) {
            msg = `Name '${name}' is already paired with another value. Column '${numToSpreadsheetColumn(k)}' row ${j}.`;
          }
          errors.push(msg);
        }
      }
      glossaryCategoriesDto.push(newDto);
    }
    if (errors.length > 0) {
      return errors;
    } else {
      return glossaryCategoriesDto;
    }
  };

  const validateCategoryUniqueness = (parsedCsv: string[][]): boolean => {
    const categorySet: Set<string> = new Set();
    const duplicateCategories: Set<string> = new Set();
    const categories = parsedCsv[0];
    for (let i = 0; i < categories.length; i += 2) {
      if (categorySet.has(categories[i])) {
        duplicateCategories.add(categories[i].slice(0, -HEADER_NAME_END.length));
      }
      categorySet.add(categories[i]);
    }
    if (duplicateCategories.size === 0) {
      return true;
    } else {
      const errorString: string =
        'Duplicate categories detected in uploaded csv. Category names must be unique within a glossary. Please resolve the duplicate categories and reupload the csv:\n' +
        Array.from(duplicateCategories).join('\n');
      feedbackCallback(errorString, true);
      return false;
    }
  };

  const uploadGlossary = (glossary: GlossaryItemDto, categories: GlossaryCategoryDto[]) => {
    const glossaryIdPromise = glossaryDao.createGlossary(glossary);
    glossaryIdPromise
      .then((id) => {
        glossary.id = id;
        for (let k = 0; k < categories.length; k++) {
          const category = categories[k];
          glossaryDao.createCategory(glossary, category);
        }
        feedbackCallback('Upload successful!');
        const menuGlossary: Option<GlossaryItemDto> = { label: glossary.name, value: glossary };
        props.selectionCallback(menuGlossary);
      })
      .catch((error) => {
        console.error('Error saving glossary or category', error);
        feedbackCallback('There was an error saving the glossary. Please notify the engineering team', true);
        return;
      });
  };
  return (
    <div>
      <Input inputProps={{ accept: '.csv', style: { display: 'none' } }} onChange={handleUpload} type="file" id="uploadButton" />
      <label htmlFor="uploadButton">
        <Button component="span">Upload CSV</Button>
      </label>
      <IconButton color="primary" onClick={openHelpCallback}>
        <InfoIcon />
      </IconButton>
    </div>
  );
}

export default UploadButton;
