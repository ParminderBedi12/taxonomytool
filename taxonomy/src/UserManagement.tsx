import { Button, Grid, TextField, Typography, withTheme, WithTheme as WithThemeProps } from '@material-ui/core';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import { UserConfirmationDialog } from '@mightyhive/material-components';
import { SearchableSelect } from '@mightyhive/material-components';
import React from 'react';
import { TaxonomyGroupClaimsDao } from './db/TaxonomyGroupClaimsDao';
import TaxonomyGroupClaimsDto from './db/TaxonomyGroupClaimsDto';
import { TaxonomyUserDao } from './db/TaxonomyUserDao';
import TaxonomyUserDto from './db/TaxonomyUserDto';
import { UserListDao } from './db/UserListDao';
import UserListDto from './db/UserListDto';
import UserManagementTable from './UserManagementTable';

interface UserManagementProps extends WithThemeProps {
  /**
   * The current users userid
   */
  userid: string;
}

interface UserManagementState {
  /**
   * The client name to be used to create a brand new client object
   */
  newClientName: string;
  /**
   * List of clients for a super user to select
   */
  clientOptions: IClientOptions[];
  selectedClient?: IClientOptions;
  allUserOptions: IUserOptions[];
  /**
   * Used to check against for creating users
   */
  allUserEmails: Set<string>;
  /**
   * The selected user that will be added if the add new user button is pressed
   */
  selectedNewUser?: IUserOptions;
  /**
   * The selected or default client data for the user
   */
  activeClient?: TaxonomyGroupClaimsDto;
  /**
   * User data for super user status / client access
   */
  taxonomyUserDto?: TaxonomyUserDto;
  /**
   * Collection of Super Admins for mgmt
   */
  superAdmins?: userDatum[];
  /**
   * Whether the Edit Client Name popup is open
   */
  editClientNameOpen: boolean;
  /**
   * Whether the Confirm Client Deletion popup is open
   */
  deleteClientOpen: boolean;
  /**
   * Email for adding new users to the platform.
   */
  newAccountEmail?: string;
}

interface IClientOptions {
  label: string;
  id: string;
}

export interface IUserOptions {
  label: string;
  id: string;
}

export interface userDatum {
  userName: string;
  id: string;
}

export interface ClientUser {
  userName: string;
  id: string;
  isUser: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Class used to manage user and create clients for taxonomy
 */
class UserManagement extends React.PureComponent<UserManagementProps, UserManagementState> {
  /**
   * The firebase interface for the group claims for who has access on what clients
   */
  taxonomyGroupClaimsDao = new TaxonomyGroupClaimsDao();
  userListDao = new UserListDao();
  taxonomyUserDao = new TaxonomyUserDao();

  constructor(props: UserManagementProps) {
    super(props);
    this.state = {
      allUserEmails: new Set<string>(),
      newClientName: '',
      clientOptions: [],
      allUserOptions: [],
      editClientNameOpen: false,
      deleteClientOpen: false,
    };
  }

  private createNewClient = () => {
    const { newClientName } = this.state;
    this.taxonomyGroupClaimsDao.create(new TaxonomyGroupClaimsDto(newClientName, {}, {}));
  };

  private createNewAccount = () => {
    const { newAccountEmail } = this.state;
    if (newAccountEmail === undefined){
      return;
    }
    this.userListDao.create(new UserListDto(newAccountEmail, newAccountEmail));
  };

  private handleDeleteConfirmationOpenClose = (open: boolean) => {
    this.setState({ deleteClientOpen: open });
  };

  private deleteClient = (client: TaxonomyGroupClaimsDto) => {
    this.taxonomyGroupClaimsDao.delete(client);
    this.setState({ activeClient: undefined, selectedClient: undefined });
  };

  public async componentDidMount() {
    const taxonomyUserDto = await this.taxonomyUserDao.get(this.props.userid);
    if (taxonomyUserDto === undefined) {
      return;
    }

    const activeClient = taxonomyUserDto.clients ? Object.keys(taxonomyUserDto.clients)[0] : undefined;

    if (taxonomyUserDto.superAdmin === true) {
      this.taxonomyGroupClaimsDao.watchForChanges((clientClaims: TaxonomyGroupClaimsDto[]) => {
        const clientOptions: IClientOptions[] = clientClaims.map((claim) => {
          return { label: claim.clientName, id: claim.id || '0' };
        });
        // Update active claim as well if found on update
        const defaultUserClient = activeClient;
        const clientClaim = clientClaims.find((claim) => this.state.activeClient?.id === claim.id || defaultUserClient === claim.id);
        this.setState({ clientOptions, activeClient: clientClaim });
      });
      this.userListDao.watchForChanges((users: UserListDto[]) => {
        const allUserOptions: IUserOptions[] = users.map((user) => {
          return { label: `${user.userName} - (${user.email})`, id: user.id || '0' };
        });
        const allUserEmails = new Set<string>(users.map((user) => user.email));
        this.setState({ allUserOptions, allUserEmails });
      });
      this.taxonomyUserDao.watchSuperAdmins((superAdminDocs: { [key: string]: TaxonomyUserDto }) => {
        const superAdmins = Object.keys(superAdminDocs).map((idKey) => {
          const uName = superAdminDocs[idKey].userName || 'Placeholder - User Has No Name';
          return { userName: uName, id: idKey };
        });
        this.setState({ superAdmins });
      });
    } else {
      if (activeClient === undefined) {
        return;
      }
      this.taxonomyGroupClaimsDao.watchDocumentForChanges(
        (clientClaims: TaxonomyGroupClaimsDto | undefined) => {
          // Update active claim as well if found on update
          this.setState({ activeClient: clientClaims });
        },
        activeClient,
        (error) => console.error(error),
      );
    }
    let selectedClient;
    if (activeClient === undefined) {
      selectedClient = undefined;
    } else {
      selectedClient = { id: activeClient, label: taxonomyUserDto.clients[activeClient].name };
    }
    this.setState({ taxonomyUserDto, selectedClient });
  }

  /**
   * Function passed into UserManagementTable to make all DB changes based on user action on the table
   * Updates user doc directly if super admin status has changed, and creates new doc if super admin doesn't exist
   * Other changes to the user doc are managed via the updateUserMetadata cloud function that triggers when the client doc is updated
   * @param editedUser: username, ID, and user/admin status from the selected row
   * @param clientClaim: the client doc to be updated. Has already been modified in the table before being used as arg here
   * @param updateSuperAdmin: whether it's necessary to update a user's super admin status
   * @param isNewUser: whether to create a new user document or update an existing one
   */
  public updateUserAccess = async (editedUser: ClientUser, clientClaim: TaxonomyGroupClaimsDto, updateSuperAdmin: boolean) => {
    const { superAdmins } = this.state;
    if (editedUser === undefined || clientClaim === undefined || superAdmins === undefined) {
      return;
    }
    // Because the user list in the table contains both net new and existing users, run a get to check if we need a new user
    const newUser = await this.taxonomyUserDao.get(editedUser.id);
    // When adding net new users, there's no existing doc to set superAdmin on, so one must be created
    // Only explicitly create new user entry if user is super admin; otherwise cloud func will handle
    if (newUser === undefined && updateSuperAdmin) {
      const newSuperAdminDto = new TaxonomyUserDto({}, editedUser.userName);
      newSuperAdminDto.superAdmin = true;
      this.taxonomyUserDao.create(newSuperAdminDto, editedUser.id);
      superAdmins.push({ id: editedUser.id, userName: editedUser.userName });
      // If we just created a super admin doc, there's no need to update it
      updateSuperAdmin = false;
      // Need to reset newUser after granting access to remove phantom entry from table
      this.setState({ superAdmins });
    }
    if (updateSuperAdmin) {
      this.taxonomyUserDao.updateSuperAdmin(editedUser);
    }
    this.taxonomyGroupClaimsDao.set(clientClaim);
  };

  private validateUserEmail = (email?: string) => {
    const { allUserEmails } = this.state;
    if (email === undefined) {
      return false;
    }
    if (!email.match(/^\S+@\S+$/g)) {
      return false;
    }
    if (allUserEmails.has(email)) {
      return false;
    }
    return true;
  }

  public render() {
    const { clientOptions, selectedClient, allUserOptions, activeClient, taxonomyUserDto, deleteClientOpen, superAdmins, newAccountEmail,
    } = this.state;
    const { theme } = this.props;
    const tableMinWidth = taxonomyUserDto?.superAdmin ? '500px' : '600px';
    return (
      <AnalyticsConsumer>
        {({ track }) => (
          <div style={{ margin: theme.spacing(4) }}>
            <div style={{ width: '100%' }}>
              <Grid container={true}>
                <Grid item={true} md={6}>
                  {taxonomyUserDto?.superAdmin && (
                    <div style={{ margin: theme.spacing(1) }}>
                      <UserConfirmationDialog
                        open={deleteClientOpen}
                        userPrompt={
                          activeClient !== undefined
                            ? `Do you want to delete '${activeClient.clientName}'? This will also delete all associated templates and glossaries`
                            : 'Attempting to delete undefined client'
                        }
                        openStatusCallback={this.handleDeleteConfirmationOpenClose}
                        operationCallback={() => {
                          this.deleteClient(activeClient!);
                          this.setState({ deleteClientOpen: false });
                          track('Taxonomy Management: Delete Client');
                        }}
                      />
                      <Typography variant="h5">Logged in as Super Admin</Typography>
                      <TextField
                        style={{ margin: theme.spacing(1) }}
                        label="Client name"
                        variant="outlined"
                        onChange={(value) => this.setState({ newClientName: value.target.value })}
                      />
                      <Button style={{ margin: theme.spacing(1) }} onClick={this.createNewClient}>
                        Add new client
                      </Button>
                      <TextField
                        style={{ margin: theme.spacing(1) }}
                        label="User email"
                        variant="outlined"
                        onChange={(value) => this.setState({ newAccountEmail: value.target.value })}
                      />
                      <Button style={{ margin: theme.spacing(1) }} onClick={this.createNewAccount} disabled={!this.validateUserEmail(newAccountEmail)}>
                        Create new user account
                      </Button>
                      <SearchableSelect<IClientOptions>
                        placeholder={selectedClient?.label || 'Select a client'}
                        loadOptions={(inputValue: string): Promise<IClientOptions[]> => {
                          return new Promise((resolve) => {
                            resolve(clientOptions.filter((o) => o.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())));
                          });
                        }}
                        defaultOptions={clientOptions.sort((a, b) => a.label.localeCompare(b.label))}
                        autoFocus={false}
                        onValueChange={(value) => {
                          this.taxonomyGroupClaimsDao.get(value.id).then((claim) => {
                            this.setState({ activeClient: claim });
                          });
                          this.setState({ selectedClient: value });
                        }}
                      />
                      <Button
                        style={{ margin: theme.spacing(1) }}
                        onClick={() => {
                          this.handleDeleteConfirmationOpenClose(true);
                        }}
                      >
                        Delete Client
                      </Button>
                    </div>
                  )}
                </Grid>
                <Grid item={true} md={6}>
                  <Typography variant="h4">{selectedClient?.label ? 'Client: ' + selectedClient.label : 'Loading...'}</Typography>
                </Grid>
              </Grid>
            </div>
            <div style={{ minWidth: tableMinWidth, margin: theme.spacing(1) }}>
              {superAdmins && activeClient && taxonomyUserDto && (
                <UserManagementTable
                  allUsers={allUserOptions}
                  clientDto={activeClient}
                  userDto={taxonomyUserDto}
                  onUpdateUser={this.updateUserAccess}
                  superAdmins={superAdmins as userDatum[]}
                  eventTrackingFunc={() => track('Taxonomy User Management: Update User Access')}
                />
              )}
            </div>
          </div>
        )}
      </AnalyticsConsumer>
    );
  }
}

export default withTheme(UserManagement);
