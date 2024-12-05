import { GlossaryCategoryDto } from './GlossaryItemDto';

/**
 * Document Object for archiving taxonomy
 */
export default class GeneratedTaxonomyDto {
  public creationTime: number | null;
  public user: string;
  public id: string | null;
  public jumpId: string;
  public taxonomyStrings: string[];
  public delimiter: string;
  /**
   * These are the stored categories with only their selected terms
   * IDs match the categories under the Glossary objects
   * Can contain selected free fields
   */
  public selectedTerms: GlossaryCategoryDto[];

  constructor(user: string, delimiter: string, jumpId: string, taxonomyStrings: string[], selectedTerms: GlossaryCategoryDto[]) {
    this.id = null;
    this.creationTime = null;
    this.user = user;
    this.jumpId = jumpId;
    this.taxonomyStrings = taxonomyStrings;
    this.delimiter = delimiter;
    this.selectedTerms = selectedTerms;
  }
}
