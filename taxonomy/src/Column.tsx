import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import RootRef from '@material-ui/core/RootRef';
import List from '@material-ui/core/List';
import ListItemCustom from './ListItemDrag';
import Typography from '@material-ui/core/Typography';
import { Grid, IconButton, Paper, Tooltip } from '@material-ui/core';
import Info from '@material-ui/icons/Info';

const Column = ({
  column,
  isDragDisabled,
  isCheckDisabled,
  onChange
}: {
  column: {
    id: string;
    name: string;
    list: {
      id: string;
      text: string;
      isActive: boolean;
    }[];
  };
  isDragDisabled: boolean;
  isCheckDisabled: boolean;
  onChange: (index: number, id: string, isActive: boolean) => void;
  }) => {
  
    const renderTooltip = () => {
      const tooltipText = `Active fields can be filled out by users.
      Inactive fields will not appear in the Taxonomy Generator, but maintain their place in the output string as "X"s.`
      return (
        <React.Fragment>
          <Tooltip
            title={
              <React.Fragment>
                <Typography variant="subtitle2">{tooltipText}</Typography>
              </React.Fragment>
            }
          >
            <IconButton color="primary">
            <Info></Info>
            </IconButton>
          </Tooltip>
        </React.Fragment>
      );
    };
  return (
    <Paper style={{ margin: 20, padding: 20, display: 'flex', flexDirection: 'column' }}>
      <Grid style={{ display: 'flex' }}><Typography variant={'h4'}>{column.name}</Typography> {column.id == 'includedFields' && (renderTooltip())} </Grid>
      <Droppable droppableId={column.id}>
        {(provided) => (
          <RootRef rootRef={provided.innerRef}>
            <div style={{ flexGrow: 1 }}>
              <List>
                {column.list.map((itemObject, index) => {
                  return <ListItemCustom index={index} itemObject={itemObject} key={'ListItemCustom-' + index} isDragDisabled={isDragDisabled} isCheckDisabled={isCheckDisabled} onChange={(index: number, isActive: boolean) => onChange(index, column.id, isActive)} />;
                })}
                {provided.placeholder}
              </List>
            </div>
          </RootRef>
        )}
      </Droppable>
    </Paper>
  );
};

export default Column;
