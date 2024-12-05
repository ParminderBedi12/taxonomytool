import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import Column from './Column';
import { useEffect } from 'react';
export type Fields = { [key: string]: { id: string; name: string; list: { id: string; text: string; isActive: boolean }[] } };

const DraggableFields = (props: { initialFields: Fields; onChange: (fields: Fields) => void; isDragDisabled: boolean }) => {
  /**
   * Credit: https://stackoverflow.com/questions/60043907/how-to-drag-drop-material-ui-cards and the typed examples
   */
  const initialColumns: Fields = {
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

  const [columns, setColumns] = useState(initialColumns);
  // On fields change update drag and drop
  useEffect(() => {
    setColumns(props.initialFields);
  }, [props.initialFields]);

  useEffect(() => {
    props.onChange(columns);
  }, [columns]);

  const onDragEnd = ({ source, destination }: DropResult) => {
    // Make sure we have a valid destination
    if (destination === undefined || destination === null) return null;

    // Make sure we're actually moving the item
    if (source.droppableId === destination.droppableId && destination.index === source.index) return null;

    // Set start and end variables
    const start = columns[source.droppableId];
    const end = columns[destination.droppableId];

    // If start is the same as end, we're in the same column
    if (start === end) {
      // Move the item within the list
      // Start by making a new list without the dragged item
      const newList = start.list.filter((_, idx) => idx !== source.index);

      // Then insert the item at the right location
      newList.splice(destination.index, 0, start.list[source.index]);

      // Then create a new copy of the column object
      const newCol = {
        id: start.id,
        name: start.name,
        list: newList,
      };

      // Update the state
      setColumns((state) => ({ ...state, [newCol.id]: newCol }));
      return null;
    } else {
      // If start is different from end, we need to update multiple columns
      // Filter the start list like before
      const newStartList = start.list.filter((_, idx) => idx !== source.index);

      // Create a new start column
      const newStartCol = {
        id: start.id,
        name: start.name,
        list: newStartList,
      };

      // Make a new end list array
      const newEndList = end.list;

      // Insert the item into the end list
      newEndList.splice(destination.index, 0, start.list[source.index]);

      // Create a new end column
      const newEndCol = {
        id: end.id,
        name: end.name,
        list: newEndList,
      };

      // Update the state
      setColumns((state) => ({
        ...state,
        [newStartCol.id]: newStartCol,
        [newEndCol.id]: newEndCol,
      }));
      return null;
    }
  };

  const onChange = (index: number, id: string, isActive: boolean) => {
    const column = columns[id];
    const itemToChange = column.list[index];
    itemToChange.isActive = isActive;
    const newCol = {
      id: column.id,
      name: column.name,
      list: column.list,
    };
    setColumns((state) => ({ ...state, [newCol.id]: newCol }));

  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Grid container direction={'row'} justify={'center'}>
        {Object.values(columns).map((column) => {
          return (
            <Grid item key={column.id} style={{ display: 'flex' }}>
              <Column column={column} isDragDisabled={props.isDragDisabled} isCheckDisabled={column.id == 'excludedFields'} onChange={onChange} />
            </Grid>
          );
        })}
      </Grid>
    </DragDropContext>
  );
};

export default DraggableFields;
