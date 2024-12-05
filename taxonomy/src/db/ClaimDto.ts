/**
 * Claim DTO copied form elsewhere (should be refactored to use shared lib at some point)
 */
export class ClaimDto {
  public ownerId: string | null;
  public groupId: string;
  public claim: string;

  constructor(ownerId: string | null, groupId: string) {
    this.ownerId = ownerId;
    this.groupId = groupId;
    this.claim = '';
  }
}
