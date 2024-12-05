import { BaseTable, SearchableSelect } from '@mightyhive/material-components';
import { ExportCsv } from '@material-table/exporters';
import React from 'react';
import { ClientUser, userDatum, IUserOptions } from './UserManagement';
import TaxonomyUserDto from './db/TaxonomyUserDto';
import TaxonomyGroupClaimsDto from './db/TaxonomyGroupClaimsDto';

interface UserManagementTableProps {
  allUsers: IUserOptions[];
  clientDto: TaxonomyGroupClaimsDto | undefined;
  onUpdateUser: (user: ClientUser, clientDto: TaxonomyGroupClaimsDto, updateSuperAdmin: boolean) => void;
  superAdmins: userDatum[];
  userDto: TaxonomyUserDto | undefined;
  eventTrackingFunc: () => void;
}

enum EditOptions {
  NEVER = 'never',
  ALWAYS = 'always',
}

const UserManagementTable = (props: UserManagementTableProps) => {
  const { allUsers, clientDto, eventTrackingFunc, onUpdateUser, superAdmins, userDto } = props;
  const userIsSuperAdmin = userDto?.superAdmin;

  const superAdminIds = superAdmins.map((entry) => {
    return entry.id;
  });
  const data: ClientUser[] = Object.keys(clientDto?.users || {}).map((userId) => {
    const isAdmin = clientDto?.admins[userId] === undefined ? false : true;
    const isSuperAdmin = superAdminIds.includes(userId);
    return { id: userId, userName: clientDto?.users[userId].userName as string, isUser: true, isAdmin, isSuperAdmin };
  });

  const superAdminEditable = userIsSuperAdmin ? EditOptions.ALWAYS : EditOptions.NEVER;

  return (
    <BaseTable
    options={{
      exportAllData: true,
      exportMenu: [
        {
          label: 'Export CSV',
          exportFunc: (cols, datas) => ExportCsv(cols, datas, 'TaxonomyOutput'),
        },
      ],
    }}
      columns={[
        {
          title: 'Name',
          field: 'userName',
          editable: 'onAdd',
          editComponent: (props) => (
            <SearchableSelect<IUserOptions>
              placeholder={props.value?.label || 'Select user'}
              loadOptions={(inputValue: string): Promise<IUserOptions[]> => {
                return new Promise((resolve) => {
                  resolve(allUsers.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                });
              }}
              defaultOptions={allUsers}
              autoFocus={false}
              onValueChange={(value) => {
                props.onChange(value);
              }}
              menuPortalTarget={document.body}
            />
          ),
          cellStyle: { width: '100%' },
          defaultSort: 'asc',
        },
        { title: 'User', field: 'isUser', type: 'boolean', cellStyle: { width: '100%' } },
        { title: 'Admin', field: 'isAdmin', type: 'boolean', cellStyle: { width: '100%' } },
        { title: 'Super Admin', field: 'isSuperAdmin', type: 'boolean', editable: superAdminEditable, cellStyle: { width: '100%' } },
      ]}
      data={data}
      title={'Users'}
      editable={{
        onRowUpdate: (newDataAny, oldDataAny) =>
          new Promise<void>((resolve, reject) => {
            if (oldDataAny === undefined) {
              resolve();
              return;
            }
            const newData = newDataAny as ClientUser;
            const oldData = oldDataAny as ClientUser;
            const admins = clientDto?.admins || {};
            const users = clientDto?.users || {};
            if (Object.keys(admins).includes(newData.id) && !newData.isAdmin) {
              delete admins[newData.id];
            } else if (!Object.keys(admins).includes(newData.id) && newData.isAdmin) {
              admins[newData.id] = { userName: newData.userName };
            }
            if (Object.keys(users).includes(newData.id) && !newData.isUser) {
              delete users[newData.id];
            } else if (!Object.keys(users).includes(newData.id) && newData.isUser) {
              users[newData.id] = { userName: newData.userName };
            }
            if (!userIsSuperAdmin) {
              newData.isSuperAdmin = oldData.isSuperAdmin;
            }
            // Used by the callback; only modify superAdmin status if it's been changed
            const updateSuperAdmin = newData.isSuperAdmin !== oldData.isSuperAdmin;
            onUpdateUser(newData, clientDto as TaxonomyGroupClaimsDto, updateSuperAdmin);
            eventTrackingFunc();
            resolve();
            return;
          }),
        onRowAdd: (newDataAny) => {
          return new Promise<void>((resolve, reject) => {
            if (newDataAny === undefined) {
              resolve();
              return;
            }
            const newData = newDataAny as ClientUser;
            // Because the user data has come from the searchable select, it's in Option format
            const userName = newData.userName['label'];
            const id = newData.userName['id'];
            newData.userName = userName;
            newData.id = id;
            const admins = clientDto?.admins || {};
            const users = clientDto?.users || {};
            if (Object.keys(admins).includes(newData.id) && !newData.isAdmin) {
              delete admins[newData.id];
            } else if (!Object.keys(admins).includes(newData.id) && newData.isAdmin) {
              admins[newData.id] = { userName: newData.userName };
            }
            if (Object.keys(users).includes(newData.id) && !newData.isUser) {
              delete users[newData.id];
            } else if (!Object.keys(users).includes(newData.id) && newData.isUser) {
              users[newData.id] = { userName: newData.userName };
            }
            if (!userIsSuperAdmin) {
              newData.isSuperAdmin = false;
            }
            onUpdateUser(newData, clientDto as TaxonomyGroupClaimsDto, newData.isSuperAdmin);
            eventTrackingFunc();
            resolve();
            return;
          });
        },
      }}
    />
  );
};

export default UserManagementTable;
