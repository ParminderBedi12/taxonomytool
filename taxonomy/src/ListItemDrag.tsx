import React, { HTMLAttributes } from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { Draggable } from 'react-beautiful-dnd';
import { Checkbox, ListItemSecondaryAction, Typography } from '@material-ui/core';

const ListItemDrag = ({
  itemObject,
  index,
  isDragDisabled,
  isCheckDisabled,
  onChange,
}: {
  index: number;
  itemObject: { id: string; text: string; isActive: boolean };
  isDragDisabled: boolean;
  isCheckDisabled: boolean;
  onChange: (index: number, isActive: boolean) => void;
}) => {
  return (
    <Draggable draggableId={itemObject.id} key={itemObject.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided) => (
        <ListItem
          key={itemObject.id}
          role={undefined}
          dense
          button
          disabled={isDragDisabled}
          ContainerProps={{ ref: provided.innerRef } as HTMLAttributes<HTMLDivElement>}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {!isCheckDisabled && <Typography style={{ minWidth: '20px' }}>{`${index + 1}.`}</Typography>}
          {!isCheckDisabled && (
            <Checkbox
              checked={itemObject.isActive}
              onChange={(event) => {
                onChange(index, event.target.checked);
              }}
            />
          )}
          <ListItemText primary={`${itemObject.text}`} />
          <ListItemSecondaryAction>
            <div />
          </ListItemSecondaryAction>
        </ListItem>
      )}
    </Draggable>
  );
};

export default ListItemDrag;
