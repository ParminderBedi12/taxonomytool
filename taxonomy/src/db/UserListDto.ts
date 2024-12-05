/**
 * Document Object getting a list of all normal users for only the super admin
 */
export default class UserListDto {
  public userName: string;
  public email: string;
  public id: string | null;

  constructor(userName: string, email: string) {
    this.userName = userName;
    this.email = email;
  }

  static defaultsConstructor() {
    return new UserListDto('default', 'default');
  }
}
