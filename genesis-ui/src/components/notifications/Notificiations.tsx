import React from 'react';
import { Button, Checkbox, createStyles, IconButton, MenuItem, Paper, Select, TextField, Theme, Typography, withStyles, WithStyles } from '@material-ui/core';
import { AuthContextConsumer } from '../../components/contexts/AuthContext';
import { NotificationDao } from '../../db/NotificationDao';
import NotificationDto from '../../db/NotificationDto';
import { BaseTable } from '@mightyhive/material-components';
import { Routes } from './../../routes/RouteLocations';
import CloseIcon from '@material-ui/icons/Close';
import ReactMarkdown from 'react-markdown';

interface NotificationsPops extends WithStyles<typeof styles> {
  /**
   *  firebase bearer token for usage with firebase requests
   */
  bearerToken: string;
  /**
   *  firebase use id to identify who has created notifications
   */
  userId: string;
  /**
   * The current users name
   */
  userName: string;
}

/**
 * The types of notifications that denotes the banners color
 */
export enum AlertType {
  error = 'Error!',
  alert = 'Alert',
  info = 'Info',
}

/**
 * The mapping of background colors to alert type
 */
export const AlertTypeToColor = new Map<AlertType, string>([
  [AlertType.error, '#fe0000'],
  [AlertType.alert, '#fe9900'],
  [AlertType.info, '#f4d97e'],
]);

/**
 * The mapping of text colors to alert type
 */
export const AlertTypeToTextColor = new Map<AlertType, string>([
  [AlertType.error, 'white'],
  [AlertType.alert, 'white'],
  [AlertType.info, 'black'],
]);

interface NotificationsState {
  /**
   *  the content to be applied to a notification
   */
  alertContents: string;
  /**
   * alert type that changes the color of the banner
   */
  selectedAlertType: AlertType;
  /**
   *  List of all notification from firestore
   */
  notificationsHistory: NotificationDto[];
  /**
   * The selected route for the notification to show up on
   */
  selectedRoute: Routes;
  /**
   * isDismissable if the new notification can be dismissed
   */
  isDismissable: boolean;
}

const defaultStringContent = 'My favorite video is [How to code](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      margin: theme.spacing(4),
      flexGrow: 1,
    },
  });

/**
 * Common function to generate alert banners
 * @param colorStyle
 * @param alertType
 * @param index
 * @param contents
 * @param dismissable
 * @param onClick
 * @returns
 */
export function renderNotification(colorStyle: string | undefined, alertType: AlertType, index: number, contents: string, dismissable: boolean, onClick: () => void) {
  return (
    <Paper key={'index' + index} elevation={3} style={{ backgroundColor: AlertTypeToColor.get(alertType) }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div style={{ color: colorStyle, flexGrow: 4, marginLeft: '20px' }}>
          <ReactMarkdown>{contents}</ReactMarkdown>
        </div>
        {dismissable && (
          <IconButton style={{ color: colorStyle }} aria-label="close" onClick={onClick}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    </Paper>
  );
}

/**
 * Class for rendering the Notifications management GUI
 */
class Notifications extends React.Component<NotificationsPops, NotificationsState> {
  notificationDao: NotificationDao = new NotificationDao();

  constructor(props: NotificationsPops) {
    super(props);
    this.state = {
      alertContents: defaultStringContent,
      selectedAlertType: AlertType.info,
      notificationsHistory: [],
      selectedRoute: Routes.Notifications,
      isDismissable: true,
    };
  }

  public componentDidMount() {
    this.notificationDao.watchForChanges(false, (notifications: NotificationDto[]) => {
      this.setState({ notificationsHistory: notifications });
    });
  }

  public render() {
    const { alertContents, selectedAlertType, selectedRoute, isDismissable, notificationsHistory } = this.state;
    const { classes, userId, userName } = this.props;
    const colorStyle = AlertTypeToTextColor.get(selectedAlertType);

    return (
      <div className={classes.root}>
        <Typography>Notification preview</Typography>
        {renderNotification(colorStyle, selectedAlertType, 0, alertContents, isDismissable, () => {})}
        <Paper>
          <div className={classes.root}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div style={{ margin: '10px' }}>
                <Typography>Alert Type</Typography>
                <Select
                  id="alert type"
                  value={selectedAlertType}
                  onChange={(event) => {
                    const alertTypeName = event.target.value as AlertType;
                    this.setState({ selectedAlertType: alertTypeName });
                  }}
                >
                  <MenuItem value={AlertType.info}>{AlertType.info}</MenuItem>
                  <MenuItem value={AlertType.alert}>{AlertType.alert}</MenuItem>
                  <MenuItem value={AlertType.error}>{AlertType.error}</MenuItem>
                </Select>
              </div>
              <div style={{ margin: '10px' }}>
                <Typography>Dismissable?</Typography>
                <Checkbox
                  checked={isDismissable}
                  onChange={(event) => {
                    this.setState({ isDismissable: event.target.checked });
                  }}
                  name="checkedB"
                  color="primary"
                />
              </div>
              <div style={{ margin: '10px' }}>
                <Typography>Route to display notification on:</Typography>
                <Select
                  id="route type"
                  value={selectedRoute}
                  onChange={(event) => {
                    const routeTypeName = event.target.value as Routes;
                    this.setState({ selectedRoute: routeTypeName });
                  }}
                >
                  <MenuItem value={Routes.Notifications}>{Routes.Notifications}</MenuItem>
                </Select>
              </div>
            </div>
          </div>
          <TextField
            name="Message Contents"
            variant="outlined"
            fullWidth={true}
            id="contents"
            label="Message Contents"
            multiline={true}
            rows={3}
            defaultValue={defaultStringContent}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
              this.setState({ alertContents: event.target.value });
            }}
          />
          <Button
            color="secondary"
            disabled={alertContents.localeCompare('') === 0}
            onClick={() => {
              const alert = new NotificationDto(userId, userName, alertContents, selectedAlertType, true, isDismissable, selectedRoute);
              this.notificationDao.createAlert(alert);
            }}
          >
            Create
          </Button>
          <BaseTable
            title={
              <Typography display="inline" variant="h4">
                Notifications
              </Typography>
            }
            data={notificationsHistory}
            columns={[
              {
                title: 'creationTime',
                field: 'creationTime',
                defaultSort: 'desc',
                render: (rowData) => {
                  const castedRowData = rowData as NotificationDto;
                  const milisecondsToSeconds = 1000;
                  const date = new Date((castedRowData.creationTime || 0) * milisecondsToSeconds);
                  return <Typography>{date.toDateString() + ' ' + date.toLocaleTimeString()}</Typography>;
                },
              },
              { title: 'UserName', field: 'creationUserName' },
              { title: 'UserId', field: 'creationUserId' },
              { title: 'locationRoute', field: 'locationRoute' },
              { title: 'contents', field: 'contents' },
              { title: 'type', field: 'type' },
              { title: 'enabled', field: 'enabled' },
              { title: 'dismissable', field: 'dismissable' },
              {
                title: 'Edit',
                render: (rowData) => {
                  const castedRowData = rowData as NotificationDto;
                  return (
                    <div>
                      <Button
                        color="secondary"
                        disabled={!castedRowData.enabled}
                        onClick={() => {
                          castedRowData.enabled = false;
                          castedRowData.creationUserId = userId;
                          castedRowData.creationUserName = userName;
                          this.notificationDao.setAlert(castedRowData);
                        }}
                      >
                        Disable
                      </Button>
                      <Button
                        color="secondary"
                        disabled={castedRowData.enabled}
                        onClick={() => {
                          castedRowData.enabled = true;
                          castedRowData.creationUserId = userId;
                          castedRowData.creationUserName = userName;
                          this.notificationDao.setAlert(castedRowData);
                        }}
                      >
                        Enable
                      </Button>
                      <Button
                        color="secondary"
                        onClick={() => {
                          this.notificationDao.deleteAlert(castedRowData);
                        }}
                      >
                        Delete!
                      </Button>
                    </div>
                  );
                },
              },
            ]}
          ></BaseTable>
        </Paper>
      </div>
    );
  }
}

function NotificationsComponentWithAuth(props: WithStyles<typeof styles>) {
  return (
    <AuthContextConsumer>
      {(auth) => {
        if (auth.idTokenResult === null) {
          console.error('Error: No idTokenResult');
          return null;
        }
        return <Notifications bearerToken={auth.idTokenResult.token} userId={auth.idTokenResult.claims.user_id} userName={auth.idTokenResult.claims.name} {...props} />;
      }}
    </AuthContextConsumer>
  );
}

export default withStyles(styles)(NotificationsComponentWithAuth);
