export type clientMetadata = { name: string; isAdmin: boolean };

/**
 * Document Object getting a list of user meta data so they know what they have access to
 */
export default class TaxonomyUserDto {
  // superAdmin is if they should be able edit everything and create clients
  public superAdmin?: boolean;
  // Admin is if they should be able to see special admin menus but nothing else. This is metadata
  public admin?: boolean;
  public clients: { [key: string]: clientMetadata };
  public userName: string;

  constructor(clients: { [key: string]: clientMetadata }, userName: string) {
    this.clients = clients;
    this.userName = userName;
  }

  static defaultsConstructor() {
    return new TaxonomyUserDto({}, '');
  }
}
