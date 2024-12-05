/**
 * Document Object for notification in genesis
 */
export default class NotificationDto {
  public creationTime: number | null;
  public creationUserId: string;
  public creationUserName: string;
  public contents: string;
  public type: string;
  public enabled: boolean;
  public dismissable: boolean;
  public locationRoute: string;
  public id: string | null;

  constructor(creationUserId: string, creationUserName: string, contents: string, type: string, enabled: boolean, dismissable: boolean, locationRoute: string) {
    this.creationUserId = creationUserId;
    this.creationUserName = creationUserName;
    this.contents = contents;
    this.type = type;
    this.enabled = enabled;
    this.dismissable = dismissable;
    this.creationTime = null;
    this.locationRoute = locationRoute;
    this.id = null;
  }

  static defaultsConstructor() {
    return new NotificationDto('', '', '', '', true, true, '');
  }
}
