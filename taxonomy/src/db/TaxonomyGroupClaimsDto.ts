/**
 * Document Object for group claims on clients with admins and normal users
 */
export default class TaxonomyGroupClaimsDto {
  public creationTime: number | null;
  public clientName: string;
  public users: { [key: string]: { userName: string } };
  public admins: { [key: string]: { userName: string } };
  public id: string | null;

  constructor(clientName: string, users: { [key: string]: { userName: string } }, admins: { [key: string]: { userName: string } }) {
    this.clientName = clientName;
    this.users = users;
    this.admins = admins;
    this.id = null;
  }

  static defaultsConstructor() {
    return new TaxonomyGroupClaimsDto('default', {}, {});
  }
}
